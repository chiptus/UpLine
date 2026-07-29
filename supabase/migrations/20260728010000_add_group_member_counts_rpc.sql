-- DB-side aggregate for group member counts, replacing the pattern of
-- transferring one group_members row per member to count client-side.
--
-- SECURITY DEFINER: group_members' SELECT RLS policy only allows a caller to
-- see rows for groups they already belong to. A plain (SECURITY INVOKER)
-- aggregate would silently under-count for the admin "all groups" view,
-- returning 0 for any group the admin isn't personally a member of. This
-- function always returns each group's true member count, regardless of the
-- caller's own membership -- the count itself isn't sensitive, only the
-- roster (still gated by group_members' RLS on direct reads) is.
CREATE OR REPLACE FUNCTION public.group_member_counts(p_group_ids UUID[])
RETURNS TABLE(group_id UUID, member_count BIGINT)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT gm.group_id, COUNT(*)::BIGINT AS member_count
  FROM group_members gm
  WHERE gm.group_id = ANY(p_group_ids)
  GROUP BY gm.group_id;
$$;

REVOKE EXECUTE ON FUNCTION public.group_member_counts(UUID[]) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.group_member_counts(UUID[]) TO authenticated;
