-- Support date-only sets (date known, time TBA) in schedule import.
-- A date-only CSV row (Date present, Start Time absent) now stores
-- time_start at the festival day's midnight (edition timezone) with
-- status = 'tba', instead of dropping the date entirely. time_end stays
-- null for a TBA set. A row carrying a real start time always resets
-- status back to 'confirmed'.
--
-- status is text + CHECK rather than a boolean or a native enum: the same
-- information as a boolean today, but extending the allowed values later
-- (e.g. a 'cancelled' status) is a one-line CHECK change instead of the
-- ALTER TYPE dance a native enum requires. See ADR-0009.

ALTER TABLE public.sets
  ADD COLUMN status TEXT NOT NULL DEFAULT 'confirmed'
    CHECK (status IN ('confirmed', 'tba'));

-- Re-create commit_schedule__create_sets / __update_sets (same signatures,
-- CREATE OR REPLACE only) to persist status alongside time_start.
--
-- The "preserve on same day" nuance is resolved upstream in computeDiff.ts
-- (sends timeStart = null for that case) -- no day-comparison logic needed
-- here, just status in lockstep with time_start.
CREATE OR REPLACE FUNCTION public.commit_schedule__update_sets(
  p_festival_edition_id UUID,
  p_sets_to_update      JSONB
)
RETURNS INT
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  v_set_elem   JSONB;
  v_set_id     UUID;
  v_new_start  TIMESTAMPTZ;
  v_new_status TEXT;
  v_row_count  INT;
  v_updated    INT := 0;
BEGIN
  FOR v_set_elem IN
    SELECT value FROM jsonb_array_elements(COALESCE(p_sets_to_update, '[]'::jsonb))
  LOOP
    v_set_id     := (v_set_elem->>'id')::UUID;
    v_new_start  := commit_schedule__parse_ts(v_set_elem->>'timeStart');
    v_new_status := COALESCE(v_set_elem->>'status', 'confirmed');

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
        WHEN v_new_status = 'tba' THEN NULL
        ELSE COALESCE(commit_schedule__parse_ts(v_set_elem->>'timeEnd'), sets.time_end)
      END,
      status      = CASE WHEN v_new_start IS NOT NULL THEN v_new_status ELSE sets.status END,
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
  v_new_start  TIMESTAMPTZ;
  v_new_status TEXT;
  v_created    INT := 0;
BEGIN
  FOR v_set_elem IN
    SELECT value FROM jsonb_array_elements(COALESCE(p_sets_to_create, '[]'::jsonb))
  LOOP
    v_new_start := commit_schedule__parse_ts(v_set_elem->>'timeStart');
    -- Trust the payload's status (a TBA set may have a midnight time_start,
    -- a date-only row, or no time_start at all, a dateless row) but force
    -- consistency on end time regardless of what the payload sends: a TBA
    -- set never has an end time.
    v_new_status := COALESCE(v_set_elem->>'status', 'confirmed');

    INSERT INTO sets (
      festival_edition_id, name, slug, description, set_type, stage_id,
      time_start, time_end, status, created_by
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
      v_new_start,
      CASE
        WHEN v_new_status = 'tba' THEN NULL
        ELSE commit_schedule__parse_ts(v_set_elem->>'timeEnd')
      END,
      v_new_status,
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
