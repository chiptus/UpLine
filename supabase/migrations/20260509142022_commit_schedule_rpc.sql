-- Add unique constraint on artists.slug (required for ON CONFLICT upsert in commit_schedule).
-- Deduplicate first: append the full id (guaranteed unique) to any slug with collisions,
-- keeping the row with the lowest id on its original slug.
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
    SELECT 1 FROM pg_constraint WHERE conname = 'artists_slug_unique'
  ) THEN
    ALTER TABLE public.artists
      ADD CONSTRAINT artists_slug_unique UNIQUE (slug);
  END IF;
END$$;

-- Add unique constraint on stages(festival_edition_id, name) for upsert.
-- Same dedup approach: any (edition, name) collisions get the offending row's
-- id suffixed onto the stage name.
UPDATE public.stages s
SET name = s.name || ' (' || s.id::text || ')'
WHERE s.id IN (
  SELECT id
  FROM (
    SELECT id,
           ROW_NUMBER() OVER (PARTITION BY festival_edition_id, name ORDER BY id) AS rn
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
  ) THEN
    ALTER TABLE public.stages
      ADD CONSTRAINT stages_edition_name_unique UNIQUE (festival_edition_id, name);
  END IF;
END$$;

-- Helpers for commit_schedule. Named with the commit_schedule__ prefix so it
-- is obvious they're internal to that RPC.

CREATE OR REPLACE FUNCTION public.commit_schedule__slugify(p_name TEXT)
RETURNS TEXT
LANGUAGE sql
IMMUTABLE
SET search_path = public
AS $$
  SELECT LOWER(
    REGEXP_REPLACE(
      REGEXP_REPLACE(TRIM(p_name), '[^a-zA-Z0-9\s]', '', 'g'),
      '\s+', '-', 'g'
    )
  );
$$;

CREATE OR REPLACE FUNCTION public.commit_schedule__resolve_stage_id(
  p_festival_edition_id UUID,
  p_stage_name          TEXT
)
RETURNS UUID
LANGUAGE sql
STABLE
SET search_path = public
AS $$
  SELECT s.id
  FROM stages s
  WHERE s.festival_edition_id = p_festival_edition_id
    AND s.name = p_stage_name
  LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.commit_schedule__parse_ts(p_value TEXT)
RETURNS TIMESTAMPTZ
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT CASE WHEN p_value IS NOT NULL THEN p_value::TIMESTAMPTZ END;
$$;

CREATE OR REPLACE FUNCTION public.commit_schedule__sync_set_artists(
  p_set_id              UUID,
  p_festival_edition_id UUID,
  p_artist_slugs        JSONB
)
RETURNS VOID
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  -- Edition-scoped delete defends against a forged set id even if the caller
  -- already verified it.
  DELETE FROM set_artists sa
  USING sets s
  WHERE sa.set_id = s.id
    AND s.id = p_set_id
    AND s.festival_edition_id = p_festival_edition_id;

  INSERT INTO set_artists (set_id, artist_id)
  SELECT p_set_id, a.id
  FROM jsonb_array_elements_text(p_artist_slugs) AS slug_val
  JOIN artists a ON a.slug = slug_val
  ON CONFLICT (set_id, artist_id) DO NOTHING;
END;
$$;

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
      stage_id    = commit_schedule__resolve_stage_id(
        p_festival_edition_id, v_set_elem->>'stageName'
      ),
      time_start  = commit_schedule__parse_ts(v_set_elem->>'timeStart'),
      time_end    = commit_schedule__parse_ts(v_set_elem->>'timeEnd'),
      updated_at  = NOW()
    WHERE id = v_set_id
      AND festival_edition_id = p_festival_edition_id;

    GET DIAGNOSTICS v_row_count = ROW_COUNT;

    IF v_row_count = 0 THEN
      RAISE EXCEPTION 'Set % not found in edition %', v_set_id, p_festival_edition_id;
    END IF;

    v_sets_updated := v_sets_updated + v_row_count;

    PERFORM commit_schedule__sync_set_artists(
      v_set_id, p_festival_edition_id, v_set_elem->'artistSlugs'
    );
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
      commit_schedule__slugify(v_set_elem->>'name'),
      NULLIF(v_set_elem->>'description', ''),
      commit_schedule__resolve_stage_id(
        p_festival_edition_id, v_set_elem->>'stageName'
      ),
      commit_schedule__parse_ts(v_set_elem->>'timeStart'),
      commit_schedule__parse_ts(v_set_elem->>'timeEnd'),
      p_user_id
    )
    RETURNING id INTO v_new_set_id;

    -- Always suffix the slug with a short id chunk so two sets with the same
    -- name (common when an artist plays multiple days) don't collide on the
    -- (edition, slug) lookup used by the set detail pages.
    UPDATE sets
    SET slug = slug || '-' || SUBSTRING(v_new_set_id::text, 1, 8)
    WHERE id = v_new_set_id;

    v_sets_created := v_sets_created + 1;

    PERFORM commit_schedule__sync_set_artists(
      v_new_set_id, p_festival_edition_id, v_set_elem->'artistSlugs'
    );
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
