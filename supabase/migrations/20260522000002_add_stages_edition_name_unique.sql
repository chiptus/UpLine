-- Add unique constraint on stages(festival_edition_id, name).
-- Required by commit_schedule's ON CONFLICT (festival_edition_id, name) upsert.
-- PR #28 introduces an equivalent constraint named stages_name_festival_edition_id_key;
-- if that lands first this migration becomes a no-op.
--
-- Dedupe first: any (edition, name) collisions get the offending row's id
-- suffixed onto the stage name. Order by archived ASC so an active stage
-- keeps the canonical name and an archived duplicate is the one renamed.
UPDATE public.stages s
SET name = s.name || ' (' || s.id::text || ')'
WHERE s.id IN (
  SELECT id
  FROM (
    SELECT id,
           ROW_NUMBER() OVER (PARTITION BY festival_edition_id, name ORDER BY archived ASC, id) AS rn
    FROM public.stages
  ) ranked
  WHERE rn > 1
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname IN ('stages_edition_name_unique', 'stages_name_festival_edition_id_key')
      AND conrelid = 'public.stages'::regclass
  ) THEN
    ALTER TABLE public.stages
      ADD CONSTRAINT stages_edition_name_unique UNIQUE (festival_edition_id, name);
  END IF;
END$$;
