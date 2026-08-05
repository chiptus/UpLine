-- p_artists_to_create: JSONB array of {name, slug}. A slug collision here can
-- only be against an archived artist (diff-schedule only proposes creates for
-- slugs it didn't find among active ones), so match+reactivate explicitly
-- instead of relying on ON CONFLICT.
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
    WHERE slug = v_elem->>'slug' AND archived = true;

    IF NOT FOUND THEN
      INSERT INTO artists (name, slug, added_by)
      VALUES (v_elem->>'name', v_elem->>'slug', p_user_id);
    END IF;
  END LOOP;
END;
$$;
