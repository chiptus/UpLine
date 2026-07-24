-- Manually override an edition's derived festival phase on staging, so you
-- can see phase-specific UI (e.g. Post-Festival retrospective ratings)
-- without waiting for real dates to pass. See docs/adr/0003-festival-phase-derived.md
-- and docs/adr/0004-retrospective-rating-separate-from-vote.md.
--
-- 1. Fill in the festival + edition slugs and the target phase below.
-- 2. Run the UPDATE.
-- 3. Reload the app.
-- 4. Run the reset UPDATE at the bottom when you're done to restore the
--    edition's normal derived phase.

-- === Set phase_override ===
-- Valid phases: 'pre-schedule', 'planning', 'live', 'post-festival'
UPDATE public.festival_editions fe
SET phase_override = 'post-festival'
FROM public.festivals f
WHERE fe.festival_id = f.id
  AND f.slug = 'YOUR_FESTIVAL_SLUG'   -- e.g. 'boom'
  AND fe.slug = 'YOUR_EDITION_SLUG';  -- e.g. '2025'

-- Sanity check
SELECT f.slug AS festival_slug, fe.slug AS edition_slug, fe.phase_override
FROM public.festival_editions fe
JOIN public.festivals f ON f.id = fe.festival_id
WHERE f.slug = 'YOUR_FESTIVAL_SLUG'
  AND fe.slug = 'YOUR_EDITION_SLUG';

-- === Reset back to derived phase (run this when done testing) ===
-- UPDATE public.festival_editions fe
-- SET phase_override = NULL
-- FROM public.festivals f
-- WHERE fe.festival_id = f.id
--   AND f.slug = 'YOUR_FESTIVAL_SLUG'
--   AND fe.slug = 'YOUR_EDITION_SLUG';
