-- Festival phase epic (#139): admin phase override + retrospective rating storage.
-- See docs/prd/festival-phases/3-post-festival.md and docs/adr/0003-festival-phase-derived.md.

-- Ordered enum mirroring FestivalPhase in src/lib/festivalPhase.ts.
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'festival_phase') THEN
    CREATE TYPE public.festival_phase AS ENUM ('pre-schedule', 'planning', 'live', 'post-festival');
  END IF;
END$$;

-- Nullable manual override of the derived phase. NULL means "use derived".
ALTER TABLE public.festival_editions
  ADD COLUMN IF NOT EXISTS phase_override public.festival_phase;

COMMENT ON COLUMN public.festival_editions.phase_override IS
  'Core Team escape hatch: forces the edition phase regardless of the derived value. NULL falls back to getFestivalPhase(). Not a scheduling system.';

-- Retrospective rating storage, distinct from votes (anticipatory "will I go"
-- vs. retrospective "how was it"). See ADR-0004.
CREATE TABLE public.set_ratings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  set_id UUID REFERENCES public.sets(id) ON DELETE CASCADE NOT NULL,
  -- 1 = meh, 2 = liked, 3 = loved. Deliberately distinct from votes.vote_type's
  -- (-1, 1, 2) scale so a rating is never misread as a vote.
  rating SMALLINT NOT NULL CHECK (rating IN (1, 2, 3)),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT set_ratings_user_set_unique UNIQUE (user_id, set_id)
);

CREATE INDEX idx_set_ratings_user_set ON public.set_ratings(user_id, set_id);
CREATE INDEX idx_set_ratings_set_id ON public.set_ratings(set_id);

ALTER TABLE public.set_ratings ENABLE ROW LEVEL SECURITY;

-- RLS mirrors votes exactly: same policy shape, one per action.
CREATE POLICY "Anyone can view set ratings" ON public.set_ratings FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create set ratings" ON public.set_ratings FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own set ratings" ON public.set_ratings FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own set ratings" ON public.set_ratings FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE TRIGGER set_ratings_updated_at
  BEFORE UPDATE ON public.set_ratings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
