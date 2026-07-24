-- Creates a new edition on the "reveal-playground" staging festival, with
-- dates and a phase_override chosen to land it in a specific festival phase
-- without waiting for real dates to pass. See
-- docs/adr/0003-festival-phase-derived.md and
-- docs/adr/0004-retrospective-rating-separate-from-vote.md.
--
-- 1. Edit the variables below (edition slug/name and target phase).
-- 2. Run this file.
-- 3. Load /festivals/reveal-playground/editions/<slug>/sets in the app.
--
-- phase_override always wins over the derived phase, so the start/end
-- dates below just need to be plausible for the chosen phase — they don't
-- have to be exact. See src/lib/festivalPhase.ts for the derivation rules
-- this overrides.

WITH target_festival AS (
  SELECT id FROM public.festivals WHERE slug = 'reveal-playground'
)
INSERT INTO public.festival_editions (
  id, festival_id, year, slug, name, description, location,
  start_date, end_date, published, schedule_reveal_level, phase_override,
  created_at, updated_at
)
SELECT
  gen_random_uuid(),
  target_festival.id,
  2026,                          -- year
  'post-festival-demo',          -- edition slug (must be unique per festival)
  'Post-Festival Demo',          -- edition name
  'Edition for demoing the post-festival retrospective rating UI',
  'Nowhere',
  '2026-01-01',                  -- start_date
  '2026-01-03',                  -- end_date
  true,                          -- published
  'full',                        -- schedule_reveal_level
  'post-festival'                -- phase_override: pre-schedule | planning | live | post-festival
FROM target_festival;

-- Sanity check
SELECT f.slug AS festival_slug, fe.slug AS edition_slug, fe.phase_override,
       fe.start_date, fe.end_date
FROM public.festival_editions fe
JOIN public.festivals f ON f.id = fe.festival_id
WHERE f.slug = 'reveal-playground'
ORDER BY fe.created_at DESC;
