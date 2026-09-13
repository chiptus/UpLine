-- The diff step could miss existing artists (its artists fetch was capped at
-- PostgREST's 1000-row default) and re-propose them as creates. The old
-- upsert only matched archived rows, so the blind INSERT then hit
-- artists_dedupe_slug and silently minted a "<slug>-2" duplicate. Match ANY
-- existing artist by slug — active or archived — and only insert when the
-- slug is genuinely free.
CREATE OR REPLACE FUNCTION public.commit_schedule__upsert_artists(
  p_artists_to_create JSONB,
  p_user_id           UUID
)
RETURNS VOID
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  v_elem JSONB;
BEGIN
  FOR v_elem IN
    SELECT value FROM jsonb_array_elements(COALESCE(p_artists_to_create, '[]'::jsonb))
  LOOP
    UPDATE artists
    SET name = v_elem->>'name', archived = false
    WHERE slug = v_elem->>'slug';

    IF NOT FOUND THEN
      INSERT INTO artists (name, slug, added_by)
      VALUES (v_elem->>'name', v_elem->>'slug', p_user_id);
    END IF;
  END LOOP;
END;
$$;
