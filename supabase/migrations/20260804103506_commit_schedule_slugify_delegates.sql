-- Call public.slugify() directly instead of going through
-- commit_schedule__slugify -- that wrapper only duplicated the same regex
-- public.slugify() now has, so there's no reason to keep the indirection.
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
    public.slugify(elem->>'name')
  FROM jsonb_array_elements(COALESCE(p_stages_to_create, '[]'::jsonb)) AS elem
  ON CONFLICT (festival_edition_id, name) DO UPDATE
    SET archived = false;
$$;

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
      festival_edition_id, name, slug, description, stage_id,
      time_start, time_end, created_by
    )
    VALUES (
      p_festival_edition_id,
      v_set_elem->>'name',
      public.slugify(v_set_elem->>'name'),
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

    v_created := v_created + 1;

    PERFORM commit_schedule__sync_set_artists(
      v_new_set_id, p_festival_edition_id, v_set_elem->'artistSlugs'
    );
  END LOOP;

  RETURN v_created;
END;
$$;

DROP FUNCTION IF EXISTS public.commit_schedule__slugify(TEXT);
