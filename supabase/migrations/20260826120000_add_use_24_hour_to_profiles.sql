-- Add use_24_hour to profiles: the user's persisted 12/24-hour time-format
-- preference, following the active_group_id/active_scope column pattern.
-- Defaults to true (24-hour) so the Explore Set page, which has always
-- hardcoded 24-hour time, shows no behavior change for existing users.
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS use_24_hour boolean NOT NULL DEFAULT true;

COMMENT ON COLUMN public.profiles.use_24_hour IS
  'Persisted 12/24-hour time-format preference, read wherever a real settings-backed default is needed (currently the Explore Set page).';
