-- Festival day-end hour: the cutoff hour (0-23) at which a "festival day"
-- ends. Sets before this hour fold into the previous festival day instead
-- of splitting at exact midnight (e.g. a 02:00 set with cutoff 6
-- groups under the previous night). Default 0 preserves today's exact
-- midnight-split behavior. See docs/adr/0002-festival-timezone-display.md.

ALTER TABLE public.festivals
  ADD COLUMN IF NOT EXISTS day_end_hour integer NOT NULL DEFAULT 0;

ALTER TABLE public.festivals
  ADD CONSTRAINT festivals_day_end_hour_range
    CHECK (day_end_hour >= 0 AND day_end_hour <= 23);

COMMENT ON COLUMN public.festivals.day_end_hour IS
  'Hour (0-23, in the festival timezone) at which a festival day ends; sets before this hour group under the previous festival day.';
