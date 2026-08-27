ALTER TABLE public.sets
  ADD COLUMN set_type text,
  ADD COLUMN external_url text;

ALTER TABLE public.sets
  ADD CONSTRAINT sets_set_type_check
  CHECK (set_type IN ('music', 'workshop', 'performance', 'other'));
