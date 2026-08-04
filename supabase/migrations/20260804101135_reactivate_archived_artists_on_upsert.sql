-- Replace ON CONFLICT (slug) upsert with an explicit reactivate-or-insert.
--
-- p_artists_to_create only ever contains slugs the diff step didn't find
-- among *active* artists (diff-schedule/index.ts queries archived = false),
-- so a slug collision here can only be against an archived artist -- the
-- ON CONFLICT branch existed purely to unarchive+rename that row. Doing the
-- match explicitly (instead of relying on the insert itself colliding)
-- means the INSERT branch below is a genuinely-new-artist insert, so the
-- slug-dedupe trigger added in the next migration can safely apply to it
-- without breaking this reactivation match.
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
