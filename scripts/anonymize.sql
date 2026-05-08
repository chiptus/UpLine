-- Scrubs PII from a freshly-restored prod dump.
-- Run after restoring data into staging or local. Idempotent.
--
-- Notes on what is and isn't synced:
--   * auth.users is NOT copied. Test accounts on the target are kept as-is.
--     This means user_id columns may reference UUIDs that don't exist in the
--     target's auth.users — which is fine for read-only testing of public data.
--   * Any new column that holds free-text user input should be added here.

BEGIN;

-- profiles.username may contain a real handle. Replace with a synthetic value.
UPDATE public.profiles
   SET username = 'user_' || substring(id::text, 1, 8);

-- artist_notes.note_content is free-form user text. Wipe it.
UPDATE public.artist_notes
   SET note_content = '[redacted]';

-- group_invites.invite_token is a live secret — rotate so old links are dead.
UPDATE public.group_invites
   SET invite_token = encode(gen_random_bytes(16), 'hex');

COMMIT;
