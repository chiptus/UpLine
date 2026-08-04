-- Add unique constraint on sets(festival_edition_id, slug).
-- Dedupe first: append the full id (guaranteed unique) to any slug that
-- collides with another set in the same edition, keeping the oldest row on
-- its original slug so existing slug-based links don't break.
UPDATE public.sets s
SET slug = s.slug || '-' || s.id::text
WHERE s.id IN (
  SELECT id
  FROM (
    SELECT id, ROW_NUMBER() OVER (
      PARTITION BY festival_edition_id, slug ORDER BY created_at ASC, id
    ) AS rn
    FROM public.sets
  ) ranked
  WHERE rn > 1
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'sets_festival_edition_id_slug_unique'
      AND conrelid = 'public.sets'::regclass
  ) THEN
    ALTER TABLE public.sets
      ADD CONSTRAINT sets_festival_edition_id_slug_unique
      UNIQUE (festival_edition_id, slug);
  END IF;
END$$;
