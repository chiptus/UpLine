-- commit_schedule__slugify duplicated the same regex logic public.slugify()
-- now has (added in the previous migration). Delegate instead of
-- maintaining two copies that could drift apart.
CREATE OR REPLACE FUNCTION public.commit_schedule__slugify(p_name TEXT)
RETURNS TEXT
LANGUAGE sql
IMMUTABLE
SET search_path = public
AS $$
  SELECT public.slugify(p_name);
$$;
