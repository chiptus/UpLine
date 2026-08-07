-- Replace the active_group_selected flag with a proper Active scope model.
-- See docs/adr/0005-active-group-model.md.
--
-- The original active_group_id-only model overloaded NULL to mean both
-- "never chosen" and "explicitly Everyone", which active_group_selected
-- patched around. Root cause instead: "which group is mine" (active_group_id)
-- and "which lens am I pinned to by default" (active_scope) are two
-- independent settings. active_group_id keeps its original meaning; NULL now
-- unambiguously means "no group chosen".
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'active_scope') THEN
    CREATE TYPE public.active_scope AS ENUM ('group', 'everyone', 'me');
  END IF;
END$$;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS active_scope public.active_scope;

COMMENT ON COLUMN public.profiles.active_scope IS
  'Durable, Settings-level pin for the default scope: which of your groups (via active_group_id), Everyone, or Me. NULL means never explicitly chosen — auto-derives to the sole group when the user has exactly one, else Everyone.';

ALTER TABLE public.profiles
  DROP COLUMN IF EXISTS active_group_selected;
