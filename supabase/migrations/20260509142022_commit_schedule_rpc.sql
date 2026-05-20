-- Helpers for commit_schedule. Named with the commit_schedule__ prefix so it
-- is obvious they're internal to that RPC.
--
-- The ON CONFLICT clauses below rely on artists_slug_unique and
-- stages_edition_name_unique. The constraints are added in the next two
-- migrations (20260509142023, 20260509142024); ON CONFLICT is resolved at
-- function-call time, not at CREATE FUNCTION time, so the ordering is fine.

CREATE OR REPLACE FUNCTION public.commit_schedule__slugify(p_name TEXT)
RETURNS TEXT
LANGUAGE sql
IMMUTABLE
SET search_path = public
AS $$
  -- Matches src/lib/slug.ts generateSlug and diff-schedule's toSlug:
  -- replace non-alphanumeric runs with a single hyphen, trim, collapse.
  SELECT TRIM(
    BOTH '-' FROM
    REGEXP_REPLACE(
      REGEXP_REPLACE(LOWER(TRIM(p_name)), '[^a-z0-9]+', '-', 'g'),
      '-+', '-', 'g'
    )
  );
$$;

CREATE OR REPLACE FUNCTION public.commit_schedule__resolve_stage_id(
  p_festival_edition_id UUID,
  p_stage_name          TEXT
)
RETURNS UUID
LANGUAGE plpgsql
STABLE
SET search_path = public
AS $$
DECLARE
  v_stage_id UUID;
BEGIN
  IF p_stage_name IS NULL THEN
    RETURN NULL;
  END IF;

  SELECT s.id
  INTO v_stage_id
  FROM stages s
  WHERE s.festival_edition_id = p_festival_edition_id
    AND s.name = p_stage_name
    AND s.archived = false
  LIMIT 1;

  IF v_stage_id IS NULL THEN
    RAISE EXCEPTION 'Stage % not found in edition %', p_stage_name, p_festival_edition_id;
  END IF;

  RETURN v_stage_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.commit_schedule__parse_ts(p_value TEXT)
RETURNS TIMESTAMPTZ
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT CASE WHEN p_value IS NOT NULL THEN p_value::TIMESTAMPTZ END;
$$;

-- Upsert artists in the import payload. The diff step only loads
-- archived = false artists, so if a slug collides with an existing archived
-- artist the CSV row was treated as new. Update the name AND unarchive so
-- sets aren't linked to a hidden artist. added_by is required (NOT NULL) and
-- attributes the create to the importing user.
CREATE OR REPLACE FUNCTION public.commit_schedule__upsert_artists(
  p_artists_to_create JSONB,
  p_user_id           UUID
)
RETURNS VOID
LANGUAGE sql
SET search_path = public
AS $$
  INSERT INTO artists (name, slug, added_by)
  SELECT elem->>'name', elem->>'slug', p_user_id
  FROM jsonb_array_elements(p_artists_to_create) AS elem
  ON CONFLICT (slug) DO UPDATE
    SET name = EXCLUDED.name,
        archived = false;
$$;

-- Upsert stages in the import payload. Same archive concern as artists:
-- an archived stage with the same (edition, name) would be classified as
-- new by the diff. DO NOTHING would leave it archived; unarchive so sets
-- resolve to a visible stage.
--
-- The slug is suffixed with an id chunk (same approach as new sets below):
-- two distinct names can slugify to the same value ("Main Stage" vs
-- "Main-Stage"), which would otherwise violate stages_slug_festival_edition
-- _unique and abort the whole import.
CREATE OR REPLACE FUNCTION public.commit_schedule__upsert_stages(
  p_festival_edition_id UUID,
  p_stages_to_create    JSONB
)
RETURNS VOID
LANGUAGE sql
SET search_path = public
AS $$
  INSERT INTO stages (festival_edition_id, name, slug)
  SELECT
    p_festival_edition_id,
    elem->>'name',
    commit_schedule__slugify(elem->>'name')
      || '-' || substr(gen_random_uuid()::text, 1, 8)
  FROM jsonb_array_elements(p_stages_to_create) AS elem
  ON CONFLICT (festival_edition_id, name) DO UPDATE
    SET archived = false;
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
DECLARE
  v_input_count    INT;
  v_resolved_count INT;
BEGIN
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
  PERFORM commit_schedule__upsert_artists(p_artists_to_create, p_user_id);
  PERFORM commit_schedule__upsert_stages(p_festival_edition_id, p_stages_to_create);

  -- Update existing sets
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

  -- Insert new sets
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

  -- Archive orphaned sets
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

-- commit_schedule and its helpers are only meant to be invoked by the
-- commit-schedule Edge Function (service role). Postgres grants EXECUTE to
-- PUBLIC by default; revoke that so an authenticated PostgREST client can't
-- call the RPC directly and bypass the Edge Function's admin-only gate.
REVOKE EXECUTE ON FUNCTION public.commit_schedule__slugify(TEXT) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.commit_schedule__resolve_stage_id(UUID, TEXT) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.commit_schedule__parse_ts(TEXT) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.commit_schedule__upsert_artists(JSONB, UUID) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.commit_schedule__upsert_stages(UUID, JSONB) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.commit_schedule__sync_set_artists(UUID, UUID, JSONB) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.commit_schedule(UUID, UUID, JSONB, JSONB, JSONB, JSONB, UUID[]) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.commit_schedule__slugify(TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION public.commit_schedule__resolve_stage_id(UUID, TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION public.commit_schedule__parse_ts(TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION public.commit_schedule__upsert_artists(JSONB, UUID) TO service_role;
GRANT EXECUTE ON FUNCTION public.commit_schedule__upsert_stages(UUID, JSONB) TO service_role;
GRANT EXECUTE ON FUNCTION public.commit_schedule__sync_set_artists(UUID, UUID, JSONB) TO service_role;
GRANT EXECUTE ON FUNCTION public.commit_schedule(UUID, UUID, JSONB, JSONB, JSONB, JSONB, UUID[]) TO service_role;
