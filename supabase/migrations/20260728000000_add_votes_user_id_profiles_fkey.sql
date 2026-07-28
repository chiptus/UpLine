-- Add a foreign key from votes.user_id to profiles(id) so PostgREST can
-- embed profiles directly in a votes query (votes -> profiles), instead of
-- fetching votes and profiles as separate round-trips and joining in JS.
-- profiles.id is itself a 1:1 mirror of auth.users(id) (created by the
-- handle_new_user trigger), so this does not change which rows are valid.
ALTER TABLE public.votes
  ADD CONSTRAINT votes_user_id_profiles_fkey
  FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
