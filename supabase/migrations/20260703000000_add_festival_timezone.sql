-- Festival timezone: the IANA zone in which all schedule times for a festival
-- are displayed, independent of the viewer's browser timezone.
-- See docs/adr/0002-festival-timezone-display.md.

ALTER TABLE public.festivals
  ADD COLUMN IF NOT EXISTS timezone text NOT NULL DEFAULT 'Europe/Lisbon';

COMMENT ON COLUMN public.festivals.timezone IS
  'IANA timezone name in which all schedule times for this festival are displayed.';
