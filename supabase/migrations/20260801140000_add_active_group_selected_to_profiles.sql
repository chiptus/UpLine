-- Distinguishes "never touched the switcher" from "explicitly selected
-- Everyone" — both persist active_group_id as NULL, but only the latter
-- should stop the single-group auto-activation from overriding it.
ALTER TABLE public.profiles
ADD COLUMN active_group_selected BOOLEAN NOT NULL DEFAULT false;
