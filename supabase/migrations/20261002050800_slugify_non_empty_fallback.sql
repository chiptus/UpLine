-- Mirrors src/lib/slug.ts generateSlug and supabase/functions/diff-schedule
-- helpers.ts toSlug; keep all three in sync. A name with no ASCII
-- alphanumerics (non-Latin script, punctuation-only) previously collapsed to
-- '', which the dedupe triggers treat as "no slug supplied" rather than
-- "slug is the empty string" (COALESCE(NULLIF(TRIM(NEW.slug), ''), ...)),
-- so the first such row got slug '' and the next '-2'.
--
-- Trims with a \s regex rather than plain TRIM(): Postgres' default TRIM
-- only strips ASCII space, while the JS mirrors' .trim() also strips tabs,
-- newlines, etc. -- a tab-padded name would otherwise hash differently here
-- than in resolveArtists() during CSV import, missing the existing row and
-- creating a duplicate.
CREATE OR REPLACE FUNCTION public.slugify(p_name TEXT)
RETURNS TEXT
LANGUAGE sql
IMMUTABLE
SET search_path = public
AS $$
  SELECT COALESCE(
    NULLIF(
      TRIM(
        BOTH '-' FROM
        REGEXP_REPLACE(
          REGEXP_REPLACE(
            LOWER(REGEXP_REPLACE(p_name, '^\s+|\s+$', '', 'g')),
            '[^a-z0-9]+', '-', 'g'
          ),
          '-+', '-', 'g'
        )
      ),
      ''
    ),
    'n-' || LEFT(MD5(LOWER(REGEXP_REPLACE(p_name, '^\s+|\s+$', '', 'g'))), 8)
  );
$$;

-- Rows created before the fallback above could end up with slug = '' (or,
-- for artists/sets whose BEFORE INSERT trigger appends a collision suffix to
-- an empty base, '-2', '-3', ...) when their name had no ASCII
-- alphanumerics. Recompute those with the now-fixed public.slugify(),
-- resolving each row's collisions (against both already-unique rows and
-- sibling rows repaired earlier in the same loop) before writing it, the
-- same way the artists/sets dedupe triggers resolve a collision on INSERT.
--
-- A plain two-pass UPDATE (recompute, then separately re-suffix collisions)
-- doesn't work here: two legacy rows sharing a name -- the exact shape the
-- old buggy trigger produced, e.g. two artists both named '!!!' with slugs
-- '' and '-2' -- recompute to the identical new slug in the same statement,
-- which violates the existing *_slug_unique constraints and aborts the
-- whole migration before the re-suffix pass ever runs.
--
-- Groups and stages have no such trigger (slug is set once, client-side, at
-- create time), so a legacy row there can only be the literal empty string
-- -- never a '-2'-style suffix -- but a repaired row's hash can still
-- collide with another group/stage's existing slug, so the same per-row
-- resolution applies to them too.

DO $$
DECLARE
  r RECORD;
  v_base TEXT;
  v_candidate TEXT;
  v_attempt INT;
BEGIN
  FOR r IN
    SELECT id, name FROM public.artists
    WHERE slug = '' OR slug ~ '^-[0-9]+$'
    ORDER BY archived ASC, id
  LOOP
    v_base := public.slugify(r.name);
    v_candidate := v_base;
    v_attempt := 1;
    WHILE EXISTS (
      SELECT 1 FROM public.artists
      WHERE slug = v_candidate AND id IS DISTINCT FROM r.id
    ) LOOP
      v_attempt := v_attempt + 1;
      v_candidate := v_base || '-' || v_attempt;
    END LOOP;
    UPDATE public.artists SET slug = v_candidate WHERE id = r.id;
  END LOOP;
END $$;

DO $$
DECLARE
  r RECORD;
  v_base TEXT;
  v_candidate TEXT;
  v_attempt INT;
BEGIN
  FOR r IN
    SELECT id, name, festival_edition_id FROM public.sets
    WHERE slug = '' OR slug ~ '^-[0-9]+$'
    ORDER BY created_at ASC, id
  LOOP
    v_base := public.slugify(r.name);
    v_candidate := v_base;
    v_attempt := 1;
    WHILE EXISTS (
      SELECT 1 FROM public.sets
      WHERE festival_edition_id = r.festival_edition_id
        AND slug = v_candidate AND id IS DISTINCT FROM r.id
    ) LOOP
      v_attempt := v_attempt + 1;
      v_candidate := v_base || '-' || v_attempt;
    END LOOP;
    UPDATE public.sets SET slug = v_candidate WHERE id = r.id;
  END LOOP;
END $$;

DO $$
DECLARE
  r RECORD;
  v_base TEXT;
  v_candidate TEXT;
  v_attempt INT;
BEGIN
  FOR r IN
    SELECT id, name, created_by FROM public.groups
    WHERE slug = ''
    ORDER BY id
  LOOP
    v_base := public.slugify(r.name);
    v_candidate := v_base;
    v_attempt := 1;
    WHILE EXISTS (
      SELECT 1 FROM public.groups
      WHERE created_by = r.created_by
        AND slug = v_candidate AND id IS DISTINCT FROM r.id
    ) LOOP
      v_attempt := v_attempt + 1;
      v_candidate := v_base || '-' || v_attempt;
    END LOOP;
    UPDATE public.groups SET slug = v_candidate WHERE id = r.id;
  END LOOP;
END $$;

DO $$
DECLARE
  r RECORD;
  v_base TEXT;
  v_candidate TEXT;
  v_attempt INT;
BEGIN
  FOR r IN
    SELECT id, name, festival_edition_id FROM public.stages
    WHERE slug = ''
    ORDER BY id
  LOOP
    v_base := public.slugify(r.name);
    v_candidate := v_base;
    v_attempt := 1;
    WHILE EXISTS (
      SELECT 1 FROM public.stages
      WHERE festival_edition_id = r.festival_edition_id
        AND slug = v_candidate AND id IS DISTINCT FROM r.id
    ) LOOP
      v_attempt := v_attempt + 1;
      v_candidate := v_base || '-' || v_attempt;
    END LOOP;
    UPDATE public.stages SET slug = v_candidate WHERE id = r.id;
  END LOOP;
END $$;
