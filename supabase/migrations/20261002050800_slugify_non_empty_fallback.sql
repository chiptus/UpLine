-- Mirrors src/lib/slug.ts generateSlug and supabase/functions/diff-schedule
-- helpers.ts toSlug; keep all three in sync. A name with no ASCII
-- alphanumerics (non-Latin script, punctuation-only) previously collapsed to
-- '', which the dedupe triggers treat as "no slug supplied" rather than
-- "slug is the empty string" (COALESCE(NULLIF(TRIM(NEW.slug), ''), ...)),
-- so the first such row got slug '' and the next '-2'.
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
          REGEXP_REPLACE(LOWER(TRIM(p_name)), '[^a-z0-9]+', '-', 'g'),
          '-+', '-', 'g'
        )
      ),
      ''
    ),
    'n-' || LEFT(MD5(LOWER(TRIM(p_name))), 8)
  );
$$;

-- Rows created before the fallback above could end up with slug = '' (or,
-- for artists/sets whose BEFORE INSERT trigger appends a collision suffix to
-- an empty base, '-2', '-3', ...) when their name had no ASCII
-- alphanumerics. Recompute those with the now-fixed public.slugify() and
-- re-resolve any new collision the same way the artists/sets
-- unique-constraint migrations already do: append the row id to all but one
-- row per slug, since slug-based lookups and the unique constraints depend
-- on a stable, unique value.
--
-- Groups and stages have no such trigger (slug is set once, client-side, at
-- create time), so a legacy row there can only be the literal empty string
-- -- never a '-2'-style suffix -- and two such rows can't coexist under the
-- same unique constraint (the second insert would have been rejected).

UPDATE public.artists a
SET slug = public.slugify(a.name)
WHERE a.slug = '' OR a.slug ~ '^-[0-9]+$';

UPDATE public.artists a
SET slug = a.slug || '-' || a.id::text
WHERE a.id IN (
  SELECT id
  FROM (
    SELECT id, ROW_NUMBER() OVER (PARTITION BY slug ORDER BY archived ASC, id) AS rn
    FROM public.artists
  ) ranked
  WHERE rn > 1
);

UPDATE public.sets s
SET slug = public.slugify(s.name)
WHERE s.slug = '' OR s.slug ~ '^-[0-9]+$';

UPDATE public.sets s
SET slug = s.slug || '-' || s.id::text
WHERE s.id IN (
  SELECT id
  FROM (
    SELECT id, ROW_NUMBER() OVER (
      PARTITION BY festival_edition_id, slug ORDER BY created_at ASC, id
    ) AS rn
    FROM public.sets
  ) ranked
  WHERE rn > 1
);

UPDATE public.groups g
SET slug = public.slugify(g.name)
WHERE g.slug = '';

UPDATE public.groups g
SET slug = g.slug || '-' || g.id::text
WHERE g.id IN (
  SELECT id
  FROM (
    SELECT id, ROW_NUMBER() OVER (PARTITION BY created_by, slug ORDER BY id) AS rn
    FROM public.groups
  ) ranked
  WHERE rn > 1
);

UPDATE public.stages st
SET slug = public.slugify(st.name)
WHERE st.slug = '';

UPDATE public.stages st
SET slug = st.slug || '-' || st.id::text
WHERE st.id IN (
  SELECT id
  FROM (
    SELECT id, ROW_NUMBER() OVER (PARTITION BY festival_edition_id, slug ORDER BY id) AS rn
    FROM public.stages
  ) ranked
  WHERE rn > 1
);
