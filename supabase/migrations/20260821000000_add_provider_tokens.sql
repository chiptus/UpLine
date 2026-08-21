-- Persistent OAuth token store for external providers (SoundCloud, Spotify).
--
-- SoundCloud's token endpoint is rate limited (50 client_credentials tokens
-- per 12h per app, 30 per hour per IP) and its refresh tokens are single-use,
-- so token acquisition must be shared across edge function instances and
-- strictly serialized: only one caller may talk to the token endpoint at a
-- time. Serialization uses a lease column (lock_until) claimed via a single
-- atomic statement -- advisory locks don't survive PostgREST's connection
-- pooling, and a transaction-scoped lock can't span the HTTP call to the
-- provider.
--
-- RLS is enabled with NO policies: only the service role (edge functions)
-- can touch this table. Tokens never reach browsers.

CREATE TABLE public.provider_tokens (
  provider TEXT PRIMARY KEY,
  access_token TEXT,
  refresh_token TEXT,
  expires_at TIMESTAMPTZ,
  lock_until TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.provider_tokens ENABLE ROW LEVEL SECURITY;

-- Atomically claim the refresh lease for a provider. Creates the row on
-- first use. Returns the stored refresh token when the lease was claimed
-- (one row), or no rows when another caller currently holds the lease or
-- the stored token is still fresh (caller should re-read instead).
CREATE OR REPLACE FUNCTION public.claim_provider_token_lease(
  p_provider TEXT,
  p_lease_seconds INTEGER DEFAULT 15
)
RETURNS TABLE(refresh_token TEXT)
LANGUAGE sql
SET search_path = ''
AS $$
  INSERT INTO public.provider_tokens AS pt (provider, lock_until, updated_at)
  VALUES (p_provider, now() + make_interval(secs => p_lease_seconds), now())
  ON CONFLICT (provider) DO UPDATE
    SET lock_until = now() + make_interval(secs => p_lease_seconds),
        updated_at = now()
    WHERE (pt.lock_until IS NULL OR pt.lock_until < now())
      AND (pt.expires_at IS NULL OR pt.expires_at < now() + interval '60 seconds')
  RETURNING pt.refresh_token;
$$;

REVOKE EXECUTE ON FUNCTION public.claim_provider_token_lease(TEXT, INTEGER) FROM PUBLIC, anon, authenticated;

-- Store a freshly obtained token set and release the lease. expires_at is
-- computed server-side to avoid client clock skew.
CREATE OR REPLACE FUNCTION public.store_provider_token(
  p_provider TEXT,
  p_access_token TEXT,
  p_refresh_token TEXT,
  p_expires_in INTEGER
)
RETURNS VOID
LANGUAGE sql
SET search_path = ''
AS $$
  UPDATE public.provider_tokens
  SET access_token = p_access_token,
      refresh_token = p_refresh_token,
      expires_at = now() + make_interval(secs => p_expires_in),
      lock_until = NULL,
      updated_at = now()
  WHERE provider = p_provider;
$$;

REVOKE EXECUTE ON FUNCTION public.store_provider_token(TEXT, TEXT, TEXT, INTEGER) FROM PUBLIC, anon, authenticated;
