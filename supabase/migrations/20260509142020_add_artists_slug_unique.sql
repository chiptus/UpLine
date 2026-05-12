-- Add unique constraint on artists.slug.
-- Required by commit_schedule's ON CONFLICT (slug) upsert, but the constraint
-- itself is a table-wide invariant so it lives in its own migration.
--
-- Dedupe first: append the full id (guaranteed unique) to any slug with
-- collisions, keeping the row with the lowest id on its original slug.
UPDATE public.artists a
SET slug = a.slug || '-' || a.id::text
WHERE a.id IN (
  SELECT id
  FROM (
    SELECT id, ROW_NUMBER() OVER (PARTITION BY slug ORDER BY id) AS rn
    FROM public.artists
  ) ranked
  WHERE rn > 1
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'artists_slug_unique'
      AND conrelid = 'public.artists'::regclass
  ) THEN
    ALTER TABLE public.artists
      ADD CONSTRAINT artists_slug_unique UNIQUE (slug);
  END IF;
END$$;
