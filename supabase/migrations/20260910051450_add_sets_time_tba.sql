-- #45: support date-only sets (date known, time TBA) in schedule import.
-- A date-only CSV row (Date present, Start Time absent) now stores
-- time_start at the festival day's midnight (edition timezone) with
-- time_tba = true, instead of dropping the date entirely. time_end stays
-- null for a TBA set. A row carrying a real start time always clears the
-- flag.

ALTER TABLE public.sets
  ADD COLUMN time_tba BOOLEAN NOT NULL DEFAULT false;

-- Re-create commit_schedule__create_sets / __update_sets (same signatures,
-- CREATE OR REPLACE only) to persist time_tba alongside time_start.
--
-- The "preserve on same day" nuance from #45 (a date-only row matching a set
-- that already has a real committed time on the same festival day must not
-- downgrade it to TBA) is resolved entirely in computeDiff.ts, upstream of
-- this RPC: it detects that case and sends timeStart = null (full omission)
-- instead of a midnight+TBA value. So this function only needs to keep
-- time_tba in lockstep with time_start using the same preserve-on-omit
-- pattern already used for stage_id/time_start/time_end/set_type -- no
-- day-comparison logic needed here.
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
  v_new_start TIMESTAMPTZ;
  v_new_tba   BOOLEAN;
  v_row_count INT;
  v_updated   INT := 0;
BEGIN
  FOR v_set_elem IN
    SELECT value FROM jsonb_array_elements(COALESCE(p_sets_to_update, '[]'::jsonb))
  LOOP
    v_set_id    := (v_set_elem->>'id')::UUID;
    v_new_start := commit_schedule__parse_ts(v_set_elem->>'timeStart');
    v_new_tba   := COALESCE((v_set_elem->>'timeTba')::boolean, false);

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
      time_start  = COALESCE(v_new_start, sets.time_start),
      -- A new TBA value clears any stale end time from a previously-timed
      -- slot (a "sometime that day" set has no end); a new real time still
      -- preserves the existing end when the row doesn't supply one; a fully
      -- omitted time preserves the end as-is.
      time_end    = CASE
        WHEN v_new_start IS NULL THEN sets.time_end
        WHEN v_new_tba THEN NULL
        ELSE COALESCE(commit_schedule__parse_ts(v_set_elem->>'timeEnd'), sets.time_end)
      END,
      time_tba    = CASE WHEN v_new_start IS NOT NULL THEN v_new_tba ELSE sets.time_tba END,
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
      time_start, time_end, time_tba, created_by
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
      COALESCE((v_set_elem->>'timeTba')::boolean, false),
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
