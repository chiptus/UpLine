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
