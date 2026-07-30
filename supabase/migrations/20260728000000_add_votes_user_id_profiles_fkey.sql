-- Add a foreign key from votes.user_id to profiles(id) so PostgREST can
-- embed profiles directly in a votes query (votes -> profiles), instead of
-- fetching votes and profiles as separate round-trips and joining in JS.
-- profiles.id is itself a 1:1 mirror of auth.users(id) (created by the
-- handle_new_user trigger), so this does not change which rows are valid.
-- No ON DELETE action: votes.user_id already cascades on auth.users deletion,
-- so this FK exists only to enable embedding, not to add a new delete path
-- from profiles to votes.
ALTER TABLE public.votes
  ADD CONSTRAINT votes_user_id_profiles_fkey
  FOREIGN KEY (user_id) REFERENCES public.profiles(id);
