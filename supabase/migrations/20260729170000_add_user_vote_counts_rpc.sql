-- DB-side aggregate for per-user vote counts, replacing the pattern of
-- transferring one votes row per vote to count client-side.
--
-- votes' SELECT RLS policy already allows anyone to read all rows
-- ("Anyone can view votes" USING (true)), so a plain SECURITY INVOKER
-- aggregate returns the same rows a caller could already read directly.
CREATE OR REPLACE FUNCTION public.user_vote_counts(p_user_ids UUID[])
RETURNS TABLE(user_id UUID, vote_count BIGINT)
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT v.user_id, COUNT(*)::BIGINT AS vote_count
  FROM votes v
  WHERE v.user_id = ANY(p_user_ids)
  GROUP BY v.user_id;
$$;

REVOKE EXECUTE ON FUNCTION public.user_vote_counts(UUID[]) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.user_vote_counts(UUID[]) TO authenticated;
