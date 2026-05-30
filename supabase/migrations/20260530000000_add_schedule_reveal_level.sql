-- Add schedule_reveal_level enum and column to festival_editions.
-- Controls how much of the schedule (set times + stage assignments) is exposed
-- to non-admins, independently of festival_editions.published.
-- See docs/adr/0001-schedule-reveal-level.md.

-- Ordered enum: order of values in the declaration is the comparison order.
-- draft < days < stages < full
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'schedule_reveal_level') THEN
    CREATE TYPE public.schedule_reveal_level AS ENUM ('draft', 'days', 'stages', 'full');
  END IF;
END$$;

ALTER TABLE public.festival_editions
  ADD COLUMN IF NOT EXISTS schedule_reveal_level public.schedule_reveal_level NOT NULL DEFAULT 'draft';

COMMENT ON COLUMN public.festival_editions.schedule_reveal_level IS
  'Controls how much of the schedule (set times + stage assignments) is exposed to non-admins. Ordered enum: draft < days < stages < full. Independent of festival_editions.published.';

-- Preserve existing public visibility: editions currently marked published had
-- their full schedule visible under the old all-or-nothing model. Promote them
-- to ''full'' so the migration is non-regressive. New editions still default
-- to ''draft''.
UPDATE public.festival_editions
   SET schedule_reveal_level = 'full'
 WHERE published = true;
