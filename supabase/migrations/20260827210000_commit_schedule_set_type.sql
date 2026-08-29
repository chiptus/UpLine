-- Schedule import learns about set types and artist-less sets (#433):
-- * create/update write sets.set_type from the payload's setType key. On
--   update an explicit type overwrites while a blank/absent one preserves the
--   stored type, mirroring how stage/time columns already behave.
-- * an explicit empty artistSlugs array is a valid roster (workshops and
--   other artist-less sets); a missing or non-array roster still raises.

CREATE OR REPLACE FUNCTION public.commit_schedule__sync_set_artists(
  p_set_id              UUID,
  p_festival_edition_id UUID,
  p_artist_slugs        JSONB
)
RETURNS VOID
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  v_input_count    INT;
  v_resolved_count INT;
BEGIN
  -- A NULL or non-array roster means a bad payload (omitted field, manual
  -- call) — bail before the DELETE below silently strips the set's roster.
  -- An explicit empty array is intentional: an artist-less set.
  IF p_artist_slugs IS NULL
     OR jsonb_typeof(p_artist_slugs) <> 'array' THEN
    RAISE EXCEPTION 'Missing artist roster in payload for set %', p_set_id;
  END IF;

  -- Validate that every distinct input slug resolves to an artist before we
  -- delete the existing links. The diff path is supposed to create missing
  -- artists in step 1 of commit_schedule, so a mismatch means a bad payload
  -- (typo, race, manual call) — bail loudly rather than silently producing
  -- a set with a partial roster.
  SELECT COUNT(DISTINCT slug_val)
    INTO v_input_count
  FROM jsonb_array_elements_text(p_artist_slugs) AS slug_val;

  SELECT COUNT(DISTINCT a.id)
    INTO v_resolved_count
  FROM jsonb_array_elements_text(p_artist_slugs) AS slug_val
  JOIN artists a ON a.slug = slug_val;

  IF v_resolved_count <> v_input_count THEN
    RAISE EXCEPTION
      'Unknown artist slug(s) in payload for set % (got % distinct slugs, resolved %)',
      p_set_id, v_input_count, v_resolved_count;
  END IF;

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

-- Update existing sets from the payload, re-syncing each set's artist roster.
-- Raises if a payload id doesn't match a set in the edition. Returns the
-- number of sets updated.
--
-- stage_id/time_start/time_end/set_type are preserved when the payload omits
-- them (resolves to NULL): a CSV without those columns corrects names and
-- rosters without wiping metadata already on the matched sets.
CREATE OR REPLACE FUNCTION public.commit_schedule__update_sets(
  p_festival_edition_id UUID,
  p_sets_to_update      JSONB
)
RETURNS INT
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  v_set_elem  JSONB;
  v_set_id    UUID;
  v_row_count INT;
  v_updated   INT := 0;
BEGIN
  FOR v_set_elem IN
    SELECT value FROM jsonb_array_elements(COALESCE(p_sets_to_update, '[]'::jsonb))
  LOOP
    v_set_id := (v_set_elem->>'id')::UUID;

    UPDATE sets
    SET
      name        = v_set_elem->>'name',
      description = NULLIF(v_set_elem->>'description', ''),
      set_type    = COALESCE(NULLIF(v_set_elem->>'setType', ''), sets.set_type),
      stage_id    = COALESCE(
        commit_schedule__resolve_stage_id(
          p_festival_edition_id, v_set_elem->>'stageName'
        ),
        sets.stage_id
      ),
      time_start  = COALESCE(
        commit_schedule__parse_ts(v_set_elem->>'timeStart'), sets.time_start
      ),
      time_end    = COALESCE(
        commit_schedule__parse_ts(v_set_elem->>'timeEnd'), sets.time_end
      ),
      updated_at  = NOW()
    WHERE id = v_set_id
      AND festival_edition_id = p_festival_edition_id;

    GET DIAGNOSTICS v_row_count = ROW_COUNT;

    IF v_row_count = 0 THEN
      RAISE EXCEPTION 'Set % not found in edition %', v_set_id, p_festival_edition_id;
    END IF;

    v_updated := v_updated + v_row_count;

    PERFORM commit_schedule__sync_set_artists(
      v_set_id, p_festival_edition_id, v_set_elem->'artistSlugs'
    );
  END LOOP;

  RETURN v_updated;
END;
$$;

-- Insert new sets from the payload and sync each set's artist roster.
-- Returns the number of sets created.
CREATE OR REPLACE FUNCTION public.commit_schedule__create_sets(
  p_festival_edition_id UUID,
  p_user_id             UUID,
  p_sets_to_create      JSONB
)
RETURNS INT
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  v_set_elem   JSONB;
  v_new_set_id UUID;
  v_created    INT := 0;
BEGIN
  FOR v_set_elem IN
    SELECT value FROM jsonb_array_elements(COALESCE(p_sets_to_create, '[]'::jsonb))
  LOOP
    INSERT INTO sets (
      festival_edition_id, name, slug, description, set_type, stage_id,
      time_start, time_end, created_by
    )
    VALUES (
      p_festival_edition_id,
      v_set_elem->>'name',
      public.slugify(v_set_elem->>'name'),
      NULLIF(v_set_elem->>'description', ''),
      NULLIF(v_set_elem->>'setType', ''),
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

    v_created := v_created + 1;

    PERFORM commit_schedule__sync_set_artists(
      v_new_set_id, p_festival_edition_id, v_set_elem->'artistSlugs'
    );
  END LOOP;

  RETURN v_created;
END;
$$;
