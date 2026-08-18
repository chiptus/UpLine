-- Address Supabase database-linter security advisor warnings:
--   1. function_search_path_mutable
--   2. rls_policy_always_true (artist_music_genres)
--   3. public_bucket_allows_listing (festival-assets)
--   4. anon/authenticated_security_definer_function_executable
--
-- Note: "Leaked password protection disabled" and "Postgres version has
-- security patches available" are dashboard/infra settings, not fixable via
-- a SQL migration, and are intentionally not addressed here.

-- =============================================================================
-- 1. function_search_path_mutable: pin search_path on functions that had none
--
--    Using '' (empty) rather than `public, pg_temp`: every function below has
--    a body that already fully schema-qualifies its table/function
--    references (or has none), so the empty search_path is safe and is the
--    strictest possible setting — it removes any schema, not just
--    non-public ones, from implicit resolution for SECURITY DEFINER
--    functions, closing the "attacker creates a same-named object earlier in
--    search_path" hijack vector entirely rather than only partially.
--
--    duplicate_set_with_votes() was the one exception: its body referenced
--    `sets`, `set_artists`, and `votes` unqualified, which would break under
--    search_path=''. Its body is schema-qualified below (section 1b) so it
--    can be safely included here too.
-- =============================================================================

ALTER FUNCTION public.create_festival_info() SET search_path = '';
ALTER FUNCTION public.bootstrap_super_admin(text) SET search_path = '';
-- duplicate_set_with_votes intentionally NOT altered here: its current body
-- (unqualified sets/set_artists/votes) is unsafe under search_path='' until
-- replaced. The CREATE OR REPLACE in section 1b below both qualifies the
-- body and sets search_path='' in one atomic statement, so it's never left
-- in a broken intermediate state.
ALTER FUNCTION public.handle_new_user() SET search_path = '';
ALTER FUNCTION public.update_updated_at_column() SET search_path = '';
ALTER FUNCTION public.commit_schedule__parse_ts(text) SET search_path = '';

-- Also flagged by the linter but not covered by the original pass above:
-- SECURITY DEFINER functions that had no search_path pinned at all (fully
-- mutable), each with a fully schema-qualified body.
ALTER FUNCTION public.get_user_id_by_email(text) SET search_path = '';
ALTER FUNCTION public.is_group_creator(uuid) SET search_path = '';
ALTER FUNCTION public.has_admin_role(uuid, admin_role) SET search_path = '';
ALTER FUNCTION public.is_admin(uuid) SET search_path = '';
ALTER FUNCTION public.can_edit_artists(uuid) SET search_path = '';
ALTER FUNCTION public.validate_invite_token(text) SET search_path = '';
ALTER FUNCTION public.use_invite_token(text, uuid) SET search_path = '';
ALTER FUNCTION public.is_group_member(uuid) SET search_path = '';
ALTER FUNCTION public.users_share_group(uuid, uuid) SET search_path = '';

-- =============================================================================
-- 1b. duplicate_set_with_votes(): schema-qualify unqualified table
--      references so it can safely run under search_path=''.
-- =============================================================================

CREATE OR REPLACE FUNCTION public.duplicate_set_with_votes(
  source_set_id uuid,
  new_time_start timestamp with time zone,
  new_time_end timestamp with time zone,
  new_stage_id uuid DEFAULT NULL,
  new_description text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  new_set_id uuid;
  source_set record;
  final_stage_id uuid;
  final_description text;
BEGIN
  SELECT * INTO source_set
  FROM public.sets
  WHERE id = source_set_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Source set not found: %', source_set_id;
  END IF;

  final_stage_id := COALESCE(new_stage_id, source_set.stage_id);
  final_description := COALESCE(new_description, source_set.description);

  INSERT INTO public.sets (
    name,
    slug,
    stage_id,
    festival_edition_id,
    time_start,
    time_end,
    description,
    archived,
    created_by
  )
  VALUES (
    source_set.name,
    source_set.slug,
    final_stage_id,
    source_set.festival_edition_id,
    new_time_start,
    new_time_end,
    final_description,
    source_set.archived,
    source_set.created_by
  )
  RETURNING id INTO new_set_id;

  INSERT INTO public.set_artists (set_id, artist_id)
  SELECT new_set_id, artist_id
  FROM public.set_artists
  WHERE set_id = source_set_id;

  INSERT INTO public.votes (user_id, set_id, vote_type, created_at)
  SELECT user_id, new_set_id, vote_type, created_at
  FROM public.votes
  WHERE set_id = source_set_id;

  RETURN new_set_id;
END;
$$;

-- =============================================================================
-- 2. rls_policy_always_true: artist_music_genres INSERT/UPDATE/DELETE policies
--    used a bare `true` check for `authenticated`. Mirror the permission model
--    used by the `artists` table itself, where mutation is gated by
--    can_edit_artists() (admin / super_admin / moderator roles).
-- =============================================================================

DROP POLICY IF EXISTS "Authenticated users can create artist music genres" ON public.artist_music_genres;
DROP POLICY IF EXISTS "Authenticated users can update artist music genres" ON public.artist_music_genres;
DROP POLICY IF EXISTS "Authenticated users can delete artist music genres" ON public.artist_music_genres;

CREATE POLICY "Authenticated users can create artist music genres" ON public.artist_music_genres
  FOR INSERT TO authenticated WITH CHECK (public.can_edit_artists(auth.uid()));

CREATE POLICY "Authenticated users can update artist music genres" ON public.artist_music_genres
  FOR UPDATE TO authenticated USING (public.can_edit_artists(auth.uid()));

CREATE POLICY "Authenticated users can delete artist music genres" ON public.artist_music_genres
  FOR DELETE TO authenticated USING (public.can_edit_artists(auth.uid()));

-- "Anyone can view artist music genres" (SELECT USING (true)) is left as-is:
-- genre tags are public read-only data shown on the public artist listing.

-- =============================================================================
-- 3. public_bucket_allows_listing: festival-assets had two redundant public
--    SELECT policies on storage.objects ("Anyone can view festival assets"
--    and "Public read access for festival assets"), which both effectively
--    allow bucket listing in addition to individual object GET.
--
--    Minimal, safe fix: dedupe down to a single SELECT policy so there is
--    exactly one path granting public read (frontend relies on
--    getPublicUrl()/direct object GET for festival-assets, see
--    src/services/storage.ts and useMapUpload.ts — this must keep working).
--
--    Full listing-prevention is out of scope for an RLS-only tweak: it
--    requires either (a) making the bucket private (public = false) and
--    serving all asset URLs as signed URLs instead of getPublicUrl(), or
--    (b) Supabase Storage's newer object-level policies that distinguish
--    GetObject from ListObjects. Either path is a product/behavior change
--    (every public asset URL in the app would need to switch to a
--    signed-URL flow) and should be a deliberate follow-up, not something
--    silently changed by a linter-driven migration.
-- =============================================================================

DROP POLICY IF EXISTS "Public read access for festival assets" ON storage.objects;
-- "Anyone can view festival assets" (FOR SELECT USING (bucket_id = 'festival-assets')) is kept as the single public-read policy.

-- =============================================================================
-- 4. anon/authenticated_security_definer_function_executable
--
--    For each SECURITY DEFINER function flagged, the judgement below is
--    based on (a) whether src/ calls it via supabase.rpc(...), and
--    (b) whether it's used inside another RLS policy's USING/WITH CHECK
--    clause (which runs as the querying role, so EXECUTE must stay granted
--    to whichever roles that policy applies to).
--
--    Left as-is (EXECUTE intentionally still available), no action taken:
--      - can_edit_artists   : rpc'd from src/ AND used inside RLS policies
--                              (sets, admin_roles, artists). Revoking would
--                              break both.
--      - get_user_id_by_email: rpc'd from src/ (useAddAdminMutation,
--                              useInviteToGroup).
--      - group_member_counts : rpc'd from src/; already scoped to
--                              `authenticated` only (REVOKE FROM PUBLIC done
--                              in 20260728010000_add_group_member_counts_rpc.sql).
--      - is_admin             : rpc'd from src/ AND used inside many RLS
--                              policies (festivals, festival_editions,
--                              festival_info, storage.objects, etc).
--      - use_invite_token     : rpc'd from src/ (accepting a group invite).
--      - validate_invite_token: rpc'd from src/ AND used inside the
--                              "Anyone can validate invite tokens" RLS
--                              policy.
--      - validate_profile_update: rpc'd from src/ (useUpdateProfile);
--                              already explicitly granted to
--                              authenticated, anon (profile edits can happen
--                              pre-confirmation) since it was introduced.
--      - has_admin_role, is_group_creator, is_group_member,
--        users_share_group : never called via rpc() from src/, but each is
--                              used inside USING/WITH CHECK of RLS policies
--                              that apply to (implicitly) all roles querying
--                              the underlying tables. Revoking EXECUTE here
--                              would turn ordinary SELECT/UPDATE/DELETE
--                              queries against admin_roles / groups /
--                              group_members / artist_notes into permission
--                              errors instead of the intended row-filtering
--                              behavior. Left granted; the WARN is accepted
--                              as inherent to this RLS-helper usage pattern.
--
--    Restricted below (not rpc'd from src/, not used inside any RLS policy):
-- =============================================================================

-- Postgres grants EXECUTE to PUBLIC by default on every new function, and
-- both `anon` and `authenticated` inherit PUBLIC's privileges. Revoking only
-- from the named roles below would leave them able to call through the
-- inherited PUBLIC grant, so PUBLIC must be revoked explicitly too.

-- One-time local-dev bootstrap for the first super admin. Already
-- self-guards (only succeeds while zero super admins exist), but there is
-- no reason for it to remain a permanently public RPC endpoint.
REVOKE EXECUTE ON FUNCTION public.bootstrap_super_admin(text) FROM PUBLIC, anon, authenticated;

-- Internal helper only ever called by validate_profile_update and
-- handle_new_user, both SECURITY DEFINER and therefore not dependent on the
-- caller's own grants to invoke it.
REVOKE EXECUTE ON FUNCTION public.check_username_exists(text, uuid) FROM PUBLIC, anon, authenticated;

-- Not called via supabase.rpc() anywhere in src/ today, and not referenced
-- by any RLS policy. Keep the pre-existing `authenticated` grant (added
-- deliberately in 20251112000000_add_duplicate_set_with_votes.sql, likely
-- for an admin "duplicate set" feature that isn't wired into the frontend
-- yet), but there is no reason for `anon` (or PUBLIC, which `anon` inherits)
-- to be able to invoke it.
REVOKE EXECUTE ON FUNCTION public.duplicate_set_with_votes(uuid, timestamp with time zone, timestamp with time zone, uuid, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.duplicate_set_with_votes(uuid, timestamp with time zone, timestamp with time zone, uuid, text) TO authenticated;
