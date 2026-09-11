-- #45 follow-up: "tba" fits a set with no date at all just as well as one
-- with a known date and no time -- both are "not fully scheduled yet". The
-- prior migration's ADD COLUMN ... DEFAULT 'confirmed' already backfilled
-- every existing row (including dateless ones) to 'confirmed'; this aligns
-- the dateless ones with the now-broader meaning of "tba".

UPDATE public.sets
SET status = 'tba'
WHERE time_start IS NULL
  AND status = 'confirmed';
