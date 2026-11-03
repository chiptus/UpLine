-- Link Wizard persists the follower count of a selected SoundCloud candidate
-- from the admin client; previously only the sync function (service role)
-- could write this table.
CREATE POLICY "Admins can insert soundcloud data" ON public.soundcloud
    FOR INSERT TO authenticated
    WITH CHECK (public.can_edit_artists(auth.uid()));

CREATE POLICY "Admins can update soundcloud data" ON public.soundcloud
    FOR UPDATE TO authenticated
    USING (public.can_edit_artists(auth.uid()))
    WITH CHECK (public.can_edit_artists(auth.uid()));
