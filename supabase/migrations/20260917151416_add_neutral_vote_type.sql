-- Adds the neutral vote type (0) alongside the existing -1 (Won't Go),
-- 1 (Interested), 2 (Must Go). A neutral vote is a real row distinct from
-- having no vote at all, so it can be excluded from Explore and filtered
-- in Schedule the same way the other vote types are.
ALTER TABLE public.votes DROP CONSTRAINT IF EXISTS votes_type_check;

ALTER TABLE public.votes
ADD CONSTRAINT votes_type_check CHECK (vote_type IN (-1, 0, 1, 2));
