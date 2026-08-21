-- Persistent OAuth token store for external providers (SoundCloud, Spotify).
--
-- SoundCloud's token endpoint is rate limited (50 client_credentials tokens
-- per 12h per app, 30 per hour per IP) and its refresh tokens are single-use,
-- so token acquisition must be shared across edge function instances and
-- strictly serialized: only one caller may talk to the token endpoint at a
-- time. Serialization uses a lease (lock_until + a fencing lease_id) claimed
-- via a single atomic statement -- advisory locks don't survive PostgREST's
-- connection pooling, and a transaction-scoped lock can't span the HTTP call
-- to the provider. The lease_id fences out stale holders: a caller whose
-- lease expired mid-request can no longer store its (possibly outdated)
-- token set or clear a lease claimed by someone else.
--
-- RLS is enabled with NO policies: only the service role (edge functions)
-- can touch this table. Tokens never reach browsers.
--
-- Written to be safely re-runnable: an earlier revision of this version was
-- already applied to staging, so re-application after a history repair must
-- not fail on existing objects.

CREATE TABLE IF NOT EXISTS public.provider_tokens (
  provider TEXT PRIMARY KEY,
  access_token TEXT,
  refresh_token TEXT,
  expires_at TIMESTAMPTZ,
  lock_until TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.provider_tokens ADD COLUMN IF NOT EXISTS lease_id UUID;

ALTER TABLE public.provider_tokens ENABLE ROW LEVEL SECURITY;

-- Atomically claim the refresh lease for a provider. Creates the row on
-- first use. Returns the stored refresh token plus a fresh fencing lease_id
-- when the lease was claimed (one row), or no rows when another caller
-- currently holds the lease or the stored token is still fresh (caller
-- should re-read instead).
DROP FUNCTION IF EXISTS public.claim_provider_token_lease(TEXT, INTEGER);
CREATE FUNCTION public.claim_provider_token_lease(
  p_provider TEXT,
  p_lease_seconds INTEGER DEFAULT 15
)
RETURNS TABLE(refresh_token TEXT, lease_id UUID)
LANGUAGE sql
SET search_path = ''
AS $$
  INSERT INTO public.provider_tokens AS pt (provider, lock_until, lease_id, updated_at)
  VALUES (p_provider, now() + make_interval(secs => p_lease_seconds), gen_random_uuid(), now())
  ON CONFLICT (provider) DO UPDATE
    SET lock_until = now() + make_interval(secs => p_lease_seconds),
        lease_id = gen_random_uuid(),
        updated_at = now()
    WHERE (pt.lock_until IS NULL OR pt.lock_until < now())
      AND (pt.expires_at IS NULL OR pt.expires_at < now() + interval '60 seconds')
  RETURNING pt.refresh_token, pt.lease_id;
$$;

REVOKE EXECUTE ON FUNCTION public.claim_provider_token_lease(TEXT, INTEGER) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.claim_provider_token_lease(TEXT, INTEGER) TO service_role;

-- Store a freshly obtained token set and release the lease. Fenced by
-- lease_id: a stale holder whose lease was re-claimed stores nothing.
-- Returns whether the store happened. expires_at is computed server-side
-- to avoid client clock skew.
DROP FUNCTION IF EXISTS public.store_provider_token(TEXT, TEXT, TEXT, INTEGER);
DROP FUNCTION IF EXISTS public.store_provider_token(TEXT, UUID, TEXT, TEXT, INTEGER);
CREATE FUNCTION public.store_provider_token(
  p_provider TEXT,
  p_lease_id UUID,
  p_access_token TEXT,
  p_refresh_token TEXT,
  p_expires_in INTEGER
)
RETURNS BOOLEAN
LANGUAGE sql
SET search_path = ''
AS $$
  WITH updated AS (
    UPDATE public.provider_tokens
    SET access_token = p_access_token,
        refresh_token = p_refresh_token,
        expires_at = now() + make_interval(secs => p_expires_in),
        lock_until = NULL,
        lease_id = NULL,
        updated_at = now()
    WHERE provider = p_provider
      AND lease_id = p_lease_id
    RETURNING 1
  )
  SELECT count(*) > 0 FROM updated;
$$;

REVOKE EXECUTE ON FUNCTION public.store_provider_token(TEXT, UUID, TEXT, TEXT, INTEGER) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.store_provider_token(TEXT, UUID, TEXT, TEXT, INTEGER) TO service_role;

-- Release a lease without storing a token (the refresh attempt failed).
-- Fenced by lease_id like store_provider_token.
DROP FUNCTION IF EXISTS public.release_provider_token_lease(TEXT, UUID);
CREATE FUNCTION public.release_provider_token_lease(
  p_provider TEXT,
  p_lease_id UUID
)
RETURNS VOID
LANGUAGE sql
SET search_path = ''
AS $$
  UPDATE public.provider_tokens
  SET lock_until = NULL,
      lease_id = NULL,
      updated_at = now()
  WHERE provider = p_provider
    AND lease_id = p_lease_id;
$$;

REVOKE EXECUTE ON FUNCTION public.release_provider_token_lease(TEXT, UUID) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.release_provider_token_lease(TEXT, UUID) TO service_role;
