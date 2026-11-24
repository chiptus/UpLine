-- Renaming a set/artist no longer rewrites its slug client-side, so UPDATE
-- needs a backstop for a slug that arrives empty/NULL. A non-empty slug on
-- UPDATE is deliberately left alone (no dedupe): a collision must surface as a
-- unique-constraint violation so the edit form can show a friendly error
-- instead of silently saving "<slug>-2".
CREATE OR REPLACE FUNCTION public.sets_dedupe_slug()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  -- Trust a caller-supplied slug as-is (commit_schedule passes its own
  -- precomputed slug and looks the row back up by it); otherwise derive one.
  v_base      TEXT := COALESCE(NULLIF(TRIM(NEW.slug), ''), public.slugify(NEW.name));
  v_candidate TEXT := v_base;
  v_attempt   INT := 1;
BEGIN
  IF TG_OP = 'UPDATE' AND NULLIF(TRIM(NEW.slug), '') IS NOT NULL THEN
    RETURN NEW;
  END IF;

  -- Serializes concurrent inserts for the same base slug so two can't both
  -- see it as free; the unique constraint is the backstop either way.
  PERFORM pg_advisory_xact_lock(hashtextextended(
    'sets:' || NEW.festival_edition_id::text || ':' || v_base, 0
  ));

  WHILE EXISTS (
    SELECT 1 FROM public.sets
    WHERE festival_edition_id = NEW.festival_edition_id
      AND slug = v_candidate
      AND id IS DISTINCT FROM NEW.id
  ) LOOP
    v_attempt := v_attempt + 1;
    v_candidate := v_base || '-' || v_attempt;
  END LOOP;

  NEW.slug := v_candidate;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS sets_dedupe_slug_trigger ON public.sets;
CREATE TRIGGER sets_dedupe_slug_trigger
  BEFORE INSERT OR UPDATE ON public.sets
  FOR EACH ROW
  EXECUTE FUNCTION public.sets_dedupe_slug();

CREATE OR REPLACE FUNCTION public.artists_dedupe_slug()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  v_base      TEXT := COALESCE(NULLIF(TRIM(NEW.slug), ''), public.slugify(NEW.name));
  v_candidate TEXT := v_base;
  v_attempt   INT := 1;
BEGIN
  IF TG_OP = 'UPDATE' AND NULLIF(TRIM(NEW.slug), '') IS NOT NULL THEN
    RETURN NEW;
  END IF;

  -- Serializes concurrent inserts for the same base slug; see sets_dedupe_slug.
  PERFORM pg_advisory_xact_lock(hashtextextended('artists:' || v_base, 0));

  WHILE EXISTS (
    SELECT 1 FROM public.artists
    WHERE slug = v_candidate
      AND id IS DISTINCT FROM NEW.id
  ) LOOP
    v_attempt := v_attempt + 1;
    v_candidate := v_base || '-' || v_attempt;
  END LOOP;

  NEW.slug := v_candidate;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS artists_dedupe_slug_trigger ON public.artists;
CREATE TRIGGER artists_dedupe_slug_trigger
  BEFORE INSERT OR UPDATE ON public.artists
  FOR EACH ROW
  EXECUTE FUNCTION public.artists_dedupe_slug();
