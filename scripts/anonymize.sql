-- Scrubs PII from a freshly-restored prod dump (public schema only).
-- Run after restoring data into staging or local. Idempotent.
--
-- auth.users IS synced separately by sync-from-prod.sh, with emails rewritten
-- to user-<short-id>@example.test at load time and no password set. Existing
-- target accounts are preserved via ON CONFLICT (id) DO NOTHING. Skip the auth
-- sync entirely with SYNC_AUTH=0.
--
-- Any new public-schema column that holds free-text user input should be
-- added below.

BEGIN;

-- profiles.username may contain a real handle, and profiles.email is UNIQUE
-- and would collide if a real user signs in to staging (the new auth.users
-- row created by Supabase would conflict with the synced profile's email).
-- Both replaced with synthetic values matching the auth.users anonymization.
UPDATE public.profiles
   SET username = 'user_' || substring(id::text, 1, 8),
       email    = 'user-' || substring(id::text, 1, 8) || '@example.test';

-- artist_notes.note_content is free-form user text. Wipe it.
UPDATE public.artist_notes
   SET note_content = '[redacted]';

-- group_invites.invite_token is a live secret — rotate so old links are dead.
UPDATE public.group_invites
   SET invite_token = encode(gen_random_bytes(16), 'hex');

COMMIT;
