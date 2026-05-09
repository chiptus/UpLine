-- Add unique constraint on artists.slug (required for ON CONFLICT upsert in commit_schedule)
-- First deduplicate any existing conflicting slugs by appending the short ID
WITH duplicates AS (
  SELECT slug, MIN(id) AS keep_id
  FROM public.artists
  GROUP BY slug
  HAVING COUNT(*) > 1
)
UPDATE public.artists a
SET slug = a.slug || '-' || SUBSTRING(a.id::text, 1, 6)
WHERE EXISTS (
  SELECT 1 FROM duplicates d
  WHERE d.slug = a.slug AND a.id != d.keep_id
);

ALTER TABLE public.artists
  ADD CONSTRAINT artists_slug_unique UNIQUE (slug);

-- Add unique constraint on stages(festival_edition_id, name) for upsert
ALTER TABLE public.stages
  ADD CONSTRAINT stages_edition_name_unique UNIQUE (festival_edition_id, name);

-- RPC: commit_schedule
-- Executes a fully resolved schedule import inside a single transaction.
-- Called by the commit-schedule Edge Function using the service role key.
CREATE OR REPLACE FUNCTION public.commit_schedule(
  p_festival_edition_id  UUID,
  p_user_id              UUID,
  p_artists_to_create    JSONB,   -- [{ name, slug }]
  p_stages_to_create     JSONB,   -- [{ name }]
  p_sets_to_create       JSONB,   -- [{ name, description, stageName, timeStart, timeEnd, artistSlugs }]
  p_sets_to_update       JSONB,   -- [{ id, name, description, stageName, timeStart, timeEnd, artistSlugs }]
  p_set_ids_to_archive   UUID[]
)
RETURNS JSONB
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  v_set_elem       JSONB;
  v_new_set_id     UUID;
  v_set_id         UUID;
  v_row_count      INT;
  v_sets_created   INT := 0;
  v_sets_updated   INT := 0;
  v_sets_archived  INT := 0;
BEGIN
  -- 1. Upsert new artists (matched on slug)
  INSERT INTO artists (name, slug)
  SELECT elem->>'name', elem->>'slug'
  FROM jsonb_array_elements(p_artists_to_create) AS elem
  ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name;

  -- 2. Upsert new stages (matched on edition + name)
  INSERT INTO stages (festival_edition_id, name)
  SELECT p_festival_edition_id, elem->>'name'
  FROM jsonb_array_elements(p_stages_to_create) AS elem
  ON CONFLICT (festival_edition_id, name) DO NOTHING;

  -- 3. Update existing sets
  FOR v_set_elem IN SELECT value FROM jsonb_array_elements(p_sets_to_update) LOOP
    v_set_id := (v_set_elem->>'id')::UUID;

    UPDATE sets
    SET
      name        = v_set_elem->>'name',
      description = NULLIF(v_set_elem->>'description', ''),
      stage_id    = (
        SELECT s.id FROM stages s
        WHERE s.festival_edition_id = p_festival_edition_id
          AND s.name = v_set_elem->>'stageName'
        LIMIT 1
      ),
      time_start  = CASE
                      WHEN (v_set_elem->>'timeStart') IS NOT NULL
                      THEN (v_set_elem->>'timeStart')::TIMESTAMPTZ
                      ELSE NULL
                    END,
      time_end    = CASE
                      WHEN (v_set_elem->>'timeEnd') IS NOT NULL
                      THEN (v_set_elem->>'timeEnd')::TIMESTAMPTZ
                      ELSE NULL
                    END,
      updated_at  = NOW()
    WHERE id = v_set_id
      AND festival_edition_id = p_festival_edition_id;

    GET DIAGNOSTICS v_row_count = ROW_COUNT;

    IF v_row_count = 0 THEN
      RAISE EXCEPTION 'Set % not found in edition %', v_set_id, p_festival_edition_id;
    END IF;

    v_sets_updated := v_sets_updated + v_row_count;

    -- Sync set_artists: delete existing links and re-insert from CSV.
    -- The DELETE is scoped via the sets table to enforce edition isolation,
    -- defending against a forged set id even though the UPDATE above already verified it.
    DELETE FROM set_artists sa
    USING sets s
    WHERE sa.set_id = s.id
      AND s.id = v_set_id
      AND s.festival_edition_id = p_festival_edition_id;

    INSERT INTO set_artists (set_id, artist_id)
    SELECT v_set_id, a.id
    FROM jsonb_array_elements_text(v_set_elem->'artistSlugs') AS slug_val
    JOIN artists a ON a.slug = slug_val
    ON CONFLICT (set_id, artist_id) DO NOTHING;
  END LOOP;

  -- 4. Insert new sets
  FOR v_set_elem IN SELECT value FROM jsonb_array_elements(p_sets_to_create) LOOP
    INSERT INTO sets (
      festival_edition_id, name, slug, description, stage_id,
      time_start, time_end, created_by
    )
    VALUES (
      p_festival_edition_id,
      v_set_elem->>'name',
      LOWER(
        REGEXP_REPLACE(
          REGEXP_REPLACE(TRIM(v_set_elem->>'name'), '[^a-zA-Z0-9\s]', '', 'g'),
          '\s+', '-', 'g'
        )
      ),
      NULLIF(v_set_elem->>'description', ''),
      (
        SELECT s.id FROM stages s
        WHERE s.festival_edition_id = p_festival_edition_id
          AND s.name = v_set_elem->>'stageName'
        LIMIT 1
      ),
      CASE
        WHEN (v_set_elem->>'timeStart') IS NOT NULL
        THEN (v_set_elem->>'timeStart')::TIMESTAMPTZ
        ELSE NULL
      END,
      CASE
        WHEN (v_set_elem->>'timeEnd') IS NOT NULL
        THEN (v_set_elem->>'timeEnd')::TIMESTAMPTZ
        ELSE NULL
      END,
      p_user_id
    )
    RETURNING id INTO v_new_set_id;

    v_sets_created := v_sets_created + 1;

    INSERT INTO set_artists (set_id, artist_id)
    SELECT v_new_set_id, a.id
    FROM jsonb_array_elements_text(v_set_elem->'artistSlugs') AS slug_val
    JOIN artists a ON a.slug = slug_val;
  END LOOP;

  -- 5. Archive orphaned sets
  IF p_set_ids_to_archive IS NOT NULL AND array_length(p_set_ids_to_archive, 1) > 0 THEN
    UPDATE sets
    SET archived = true, updated_at = NOW()
    WHERE id = ANY(p_set_ids_to_archive)
      AND festival_edition_id = p_festival_edition_id;

    GET DIAGNOSTICS v_sets_archived = ROW_COUNT;
  END IF;

  RETURN jsonb_build_object(
    'setsCreated', v_sets_created,
    'setsUpdated', v_sets_updated,
    'setsArchived', v_sets_archived
  );

EXCEPTION WHEN OTHERS THEN
  RAISE EXCEPTION 'commit_schedule failed: %', SQLERRM;
END;
$$;
