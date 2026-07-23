-- Add active_group_id to profiles: the Group a user is currently viewing the
-- app "as". Global across festivals/editions. Nullable; cleared automatically
-- if the referenced group is deleted.
ALTER TABLE public.profiles
ADD COLUMN active_group_id UUID REFERENCES public.groups(id) ON DELETE SET NULL;

CREATE INDEX idx_profiles_active_group_id ON public.profiles(active_group_id);
