-- Generate + dedupe slugs at the DB layer on insert. If the caller didn't
-- supply a slug (the app create paths pass an empty placeholder -- they no
-- longer compute one client-side), derive it from `name`. If the caller did
-- supply one, trust it as the base instead of overriding it: commit_schedule
-- threads its own precomputed slug through the same call (e.g. to look an
-- artist back up via artistSlugs right after inserting it), so recomputing
-- from `name` there would silently diverge from what the caller expects to
-- find. Either way, on a collision within scope, append a numeric counter:
-- try the base slug, then `-2`, `-3`, etc, until one is free.
--
-- public.slugify() mirrors src/lib/slug.ts generateSlug (commit_schedule's
-- helpers call this directly too, see next migration) so they stay
-- byte-for-byte identical by construction.
CREATE OR REPLACE FUNCTION public.slugify(p_name TEXT)
RETURNS TEXT
LANGUAGE sql
IMMUTABLE
SET search_path = public
AS $$
  SELECT TRIM(
    BOTH '-' FROM
    REGEXP_REPLACE(
      REGEXP_REPLACE(LOWER(TRIM(p_name)), '[^a-z0-9]+', '-', 'g'),
      '-+', '-', 'g'
    )
  );
$$;

-- Safe for commit_schedule__create_sets (plain INSERT, no conflict target)
-- and, as of the previous migration, commit_schedule__upsert_artists too
-- (its reactivate-archived-artist match now happens before the INSERT, via
-- an explicit UPDATE, not via ON CONFLICT on the possibly-rewritten slug).
--
-- Two concurrent inserts for the same scope+base-slug could otherwise both
-- see it as free and race to claim it, so each function takes a
-- transaction-scoped advisory lock keyed on (scope, base slug) before
-- checking for a collision -- a second concurrent insert for the same key
-- blocks until the first transaction commits or rolls back, then makes its
-- decision against up-to-date data. The unique constraints added in the
-- previous migration remain the hard backstop, but callers shouldn't need
-- to handle a 23505 from this in practice.

CREATE OR REPLACE FUNCTION public.sets_dedupe_slug()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  v_base      TEXT := COALESCE(NULLIF(TRIM(NEW.slug), ''), public.slugify(NEW.name));
  v_candidate TEXT := v_base;
  v_attempt   INT := 1;
BEGIN
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
  BEFORE INSERT ON public.sets
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
  BEFORE INSERT ON public.artists
  FOR EACH ROW
  EXECUTE FUNCTION public.artists_dedupe_slug();
