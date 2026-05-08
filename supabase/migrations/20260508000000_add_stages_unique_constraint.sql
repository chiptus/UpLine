ALTER TABLE public.stages
ADD CONSTRAINT stages_name_festival_edition_id_key UNIQUE (name, festival_edition_id);
