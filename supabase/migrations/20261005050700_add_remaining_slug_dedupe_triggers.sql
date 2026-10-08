-- Extends the BEFORE INSERT slug-dedupe triggers from
-- 20260804101202_add_slug_dedupe_triggers.sql (sets, artists) to groups,
-- stages, festivals and festival_editions so the client no longer computes
-- slugs on create. Each trigger derives a slug from `name` when none is
-- supplied and suffixes `-2`, `-3`, ... within the scope of the table's
-- existing unique constraint. The slug columns stay NOT NULL: BEFORE triggers
-- fire before the NOT NULL check, so callers send '' to mean "derive it"
-- (same convention as sets).
--
-- Unlike sets/artists, a caller-supplied slug is left untouched: the admin
-- festival dialogs let a user type one, and silently renaming it to `-2`
-- would hide a real conflict that the unique constraint should surface.
--
-- The advisory lock is keyed on the uniqueness scope, not the base slug: two
-- concurrent inserts with different bases (`crew` and `crew-2`) can resolve
-- to the same final slug, so they must serialize on the same lock. It is taken
-- before the explicit-slug early return too: an uncommitted explicit insert
-- (e.g. commit_schedule) must make a concurrent derived insert wait and then
-- see its slug, rather than pick the same one and hit the unique constraint.

CREATE OR REPLACE FUNCTION public.groups_dedupe_slug()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  v_base      TEXT;
  v_candidate TEXT;
  v_attempt   INT := 1;
BEGIN
  PERFORM pg_advisory_xact_lock(hashtextextended('groups:' || NEW.created_by::text, 0));

  IF NULLIF(TRIM(NEW.slug), '') IS NOT NULL THEN
    RETURN NEW;
  END IF;

  v_base := public.slugify(NEW.name);
  v_candidate := v_base;

  WHILE EXISTS (
    SELECT 1 FROM public.groups
    WHERE created_by = NEW.created_by
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

DROP TRIGGER IF EXISTS groups_dedupe_slug_trigger ON public.groups;
CREATE TRIGGER groups_dedupe_slug_trigger
  BEFORE INSERT ON public.groups
  FOR EACH ROW
  EXECUTE FUNCTION public.groups_dedupe_slug();

CREATE OR REPLACE FUNCTION public.stages_dedupe_slug()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  v_base      TEXT;
  v_candidate TEXT;
  v_attempt   INT := 1;
BEGIN
  PERFORM pg_advisory_xact_lock(hashtextextended('stages:' || NEW.festival_edition_id::text, 0));

  IF NULLIF(TRIM(NEW.slug), '') IS NOT NULL THEN
    RETURN NEW;
  END IF;

  v_base := public.slugify(NEW.name);
  v_candidate := v_base;

  WHILE EXISTS (
    SELECT 1 FROM public.stages
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

DROP TRIGGER IF EXISTS stages_dedupe_slug_trigger ON public.stages;
CREATE TRIGGER stages_dedupe_slug_trigger
  BEFORE INSERT ON public.stages
  FOR EACH ROW
  EXECUTE FUNCTION public.stages_dedupe_slug();

CREATE OR REPLACE FUNCTION public.festivals_dedupe_slug()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  v_base      TEXT;
  v_candidate TEXT;
  v_attempt   INT := 1;
BEGIN
  PERFORM pg_advisory_xact_lock(hashtextextended('festivals', 0));

  IF NULLIF(TRIM(NEW.slug), '') IS NOT NULL THEN
    RETURN NEW;
  END IF;

  v_base := public.slugify(NEW.name);
  v_candidate := v_base;

  WHILE EXISTS (
    SELECT 1 FROM public.festivals
    WHERE TRUE
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

DROP TRIGGER IF EXISTS festivals_dedupe_slug_trigger ON public.festivals;
CREATE TRIGGER festivals_dedupe_slug_trigger
  BEFORE INSERT ON public.festivals
  FOR EACH ROW
  EXECUTE FUNCTION public.festivals_dedupe_slug();

CREATE OR REPLACE FUNCTION public.festival_editions_dedupe_slug()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  v_base      TEXT;
  v_candidate TEXT;
  v_attempt   INT := 1;
BEGIN
  PERFORM pg_advisory_xact_lock(hashtextextended('festival_editions:' || NEW.festival_id::text, 0));

  IF NULLIF(TRIM(NEW.slug), '') IS NOT NULL THEN
    RETURN NEW;
  END IF;

  v_base := public.slugify(NEW.name);
  v_candidate := v_base;

  WHILE EXISTS (
    SELECT 1 FROM public.festival_editions
    WHERE festival_id = NEW.festival_id
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

DROP TRIGGER IF EXISTS festival_editions_dedupe_slug_trigger ON public.festival_editions;
CREATE TRIGGER festival_editions_dedupe_slug_trigger
  BEFORE INSERT ON public.festival_editions
  FOR EACH ROW
  EXECUTE FUNCTION public.festival_editions_dedupe_slug();
