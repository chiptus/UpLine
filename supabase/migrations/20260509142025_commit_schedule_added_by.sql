-- Fix: commit_schedule was inserting artists without added_by, which is
-- NOT NULL. Thread p_user_id into the artists upsert.

CREATE OR REPLACE FUNCTION public.commit_schedule(
  p_festival_edition_id  UUID,
  p_user_id              UUID,
  p_artists_to_create    JSONB,
  p_stages_to_create     JSONB,
  p_sets_to_create       JSONB,
  p_sets_to_update       JSONB,
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
  INSERT INTO artists (name, slug, added_by)
  SELECT elem->>'name', elem->>'slug', p_user_id
  FROM jsonb_array_elements(p_artists_to_create) AS elem
  ON CONFLICT (slug) DO UPDATE
    SET name = EXCLUDED.name,
        archived = false;

  INSERT INTO stages (festival_edition_id, name)
  SELECT p_festival_edition_id, elem->>'name'
  FROM jsonb_array_elements(p_stages_to_create) AS elem
  ON CONFLICT (festival_edition_id, name) DO UPDATE
    SET archived = false;

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

    UPDATE sets
    SET slug = slug || '-' || SUBSTRING(v_new_set_id::text, 1, 8)
    WHERE id = v_new_set_id;

    v_sets_created := v_sets_created + 1;

    PERFORM commit_schedule__sync_set_artists(
      v_new_set_id, p_festival_edition_id, v_set_elem->'artistSlugs'
    );
  END LOOP;

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
END;
$$;
