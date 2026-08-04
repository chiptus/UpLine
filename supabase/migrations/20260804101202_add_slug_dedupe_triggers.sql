-- Dedupe slugs at the DB layer on insert, so every insert path (app code,
-- the commit_schedule RPC, seed scripts, ...) gets a unique slug for free
-- instead of relying on each caller to pre-check or retry individually.
-- On a collision within scope, append a numeric counter: try the given
-- slug, then `-2`, `-3`, etc, until one is free.
--
-- Safe for commit_schedule__create_sets (plain INSERT, no conflict target)
-- and, as of the previous migration, commit_schedule__upsert_artists too
-- (its reactivate-archived-artist match now happens before the INSERT, via
-- an explicit UPDATE, not via ON CONFLICT on the possibly-rewritten slug).
--
-- This can still race under concurrent inserts (two transactions can both
-- see a slug as free and pick the same candidate); the unique constraints
-- added two migrations ago are the actual backstop for that -- the loser
-- gets a 23505 the caller can retry.

CREATE OR REPLACE FUNCTION public.sets_dedupe_slug()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  v_base      TEXT := NEW.slug;
  v_candidate TEXT := NEW.slug;
  v_attempt   INT := 1;
BEGIN
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
  v_base      TEXT := NEW.slug;
  v_candidate TEXT := NEW.slug;
  v_attempt   INT := 1;
BEGIN
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
