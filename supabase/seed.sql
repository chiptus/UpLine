-- Comprehensive seed data for festival voting app
-- This file creates realistic test data for local development


-- Create a test user for seeding data (this would normally be done via auth flow)
-- Using a predictable ID so we can reference it in test groups, votes, etc.
INSERT INTO auth.users (
  id,
  instance_id,
  aud,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  raw_user_meta_data,
  is_super_admin,
  role,
  confirmation_token,
  recovery_token,
  email_change,
  email_change_token_new
) VALUES (
  '11111111-1111-1111-1111-111111111111',
  '00000000-0000-0000-0000-000000000000',
  'authenticated',
  'test@example.com',
  '$2a$10$example_hash',
  now(),
  now(),
  now(),
  '{"username": "testuser"}',
  false,
  'authenticated',
  '',
  '',
  '',
  ''
) ON CONFLICT (id) DO NOTHING;

-- Mark this seeded user as already onboarded so tests can use it as an "existing user".
UPDATE public.profiles
SET completed_onboarding = true
WHERE id = '11111111-1111-1111-1111-111111111111';

-- GoTrue's OTP sign-in requires a matching auth.identities row for existing users.
INSERT INTO auth.identities (
  id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at
) VALUES (
  '11111111-1111-1111-1111-111111111111',
  '11111111-1111-1111-1111-111111111111',
  '11111111-1111-1111-1111-111111111111',
  jsonb_build_object('sub', '11111111-1111-1111-1111-111111111111', 'email', 'test@example.com'),
  'email',
  now(),
  now(),
  now()
) ON CONFLICT (id) DO NOTHING;

-- Grants the seeded user an admin role so admin-only integration tests
-- (e.g. commit-schedule's Deno tests) have a real admin user id to act as.
INSERT INTO public.admin_roles (user_id, role, created_by)
VALUES (
  '11111111-1111-1111-1111-111111111111',
  'admin',
  '11111111-1111-1111-1111-111111111111'
) ON CONFLICT (user_id, role) DO NOTHING;

-- Dev login: fixed email + OTP so local/staging don't need a real magic-link
-- email to sign in as a super admin. Runs only via `supabase db reset`
-- (local) and scripts/recreate-staging.sh's `db reset --linked` (staging)
-- -- prod is never reset, only migrated (`supabase db push`), so this never
-- reaches prod.
--
-- Real `signInWithOtp` calls (clicking "Send" in the UI) overwrite
-- recovery_token with an actual generated one, breaking the fixed code.
-- This trigger re-pins it back to the fixed code on every insert/update to
-- this email, so it survives real sends too.
CREATE OR REPLACE FUNCTION public.pin_dev_login_otp()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.email = 'chiptus@gmail.com' THEN
    NEW.recovery_token := encode(sha224(concat(NEW.email, '123456')::bytea), 'hex');
    NEW.recovery_sent_at := now();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS pin_dev_login_otp_trigger ON auth.users;
CREATE TRIGGER pin_dev_login_otp_trigger
BEFORE INSERT OR UPDATE ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.pin_dev_login_otp();

-- Upserts by email rather than a fixed id, since staging syncs anonymized
-- prod data (scripts/sync-from-prod.sh) which may already have a real row
-- for this email -- in that case we just touch it so the trigger above
-- re-pins its OTP, instead of inserting a conflicting duplicate.
DO $$
DECLARE
  dev_user_id UUID;
BEGIN
  SELECT id INTO dev_user_id FROM auth.users WHERE email = 'chiptus@gmail.com';

  IF dev_user_id IS NULL THEN
    dev_user_id := '22222222-2222-2222-2222-222222222222';
    INSERT INTO auth.users (
      id, instance_id, aud, email, encrypted_password, email_confirmed_at,
      created_at, updated_at, raw_user_meta_data, is_super_admin, role,
      confirmation_token, recovery_token, recovery_sent_at, email_change, email_change_token_new
    ) VALUES (
      dev_user_id, '00000000-0000-0000-0000-000000000000', 'authenticated',
      'chiptus@gmail.com', '$2a$10$example_hash', now(), now(), now(),
      '{"username": "devlogin"}', false, 'authenticated', '', '', now(), '', ''
    );

    INSERT INTO auth.identities (
      id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at
    ) VALUES (
      dev_user_id, dev_user_id, dev_user_id,
      jsonb_build_object('sub', dev_user_id, 'email', 'chiptus@gmail.com'),
      'email', now(), now(), now()
    );
  ELSE
    -- Row already exists (e.g. synced from prod) -- touch it so the trigger
    -- above re-pins recovery_token to the fixed OTP.
    UPDATE auth.users SET updated_at = now() WHERE id = dev_user_id;
  END IF;

  UPDATE public.profiles SET completed_onboarding = true WHERE id = dev_user_id;

  INSERT INTO public.admin_roles (user_id, role, created_by)
  VALUES (dev_user_id, 'super_admin', dev_user_id)
  ON CONFLICT (user_id, role) DO NOTHING;
END $$;



-- Insert festival artists with realistic schedule (July 12-14, 2025)
INSERT INTO public.artists (
  id, name, description, stage, time_start, time_end, 
  added_by, spotify_url, soundcloud_url, created_at, slug
) VALUES 
  -- July 12, 2025 (Friday)
  ('a1111111-1111-1111-1111-111111111111', 'Maya Jane Coles', 'British DJ and producer known for her deep house and techno sets', 
   'Main Stage', '2025-07-12 22:00:00+00', '2025-07-12 23:30:00+00', '11111111-1111-1111-1111-111111111111',
   'https://open.spotify.com/artist/1234567', 'https://soundcloud.com/mayajanecoles', now(), 'maya-jane-coles'),
  ('a2222222-2222-2222-2222-222222222222', 'Ben Böhmer', 'German melodic house and techno producer', 
   'Club Stage', '2025-07-12 20:00:00+00', '2025-07-12 21:30:00+00', '11111111-1111-1111-1111-111111111111',
   'https://open.spotify.com/artist/2345678', 'https://soundcloud.com/benbohmer', now(), 'ben-bohmer'),
  ('a3333333-3333-3333-3333-333333333333', 'Kiara Scuro', 'Rising star in dark techno', 
   'Club Stage', '2025-07-12 23:30:00+00', '2025-07-13 01:00:00+00', '11111111-1111-1111-1111-111111111111',
   NULL, 'https://soundcloud.com/kiarascuro', now(), 'kiara-scuro'),
  ('a4444444-4444-4444-4444-444444444444', 'Nils Frahm', 'Ambient electronic composer and pianist', 
   'Ambient Garden', '2025-07-12 18:00:00+00', '2025-07-12 19:30:00+00', '11111111-1111-1111-1111-111111111111',
   'https://open.spotify.com/artist/3456789', NULL, now(), 'nils-frahm'),
  ('a5555555-5555-5555-5555-555555555555', 'Charlotte de Witte', 'Belgian techno DJ and producer', 
   'Main Stage', '2025-07-13 01:00:00+00', '2025-07-13 02:30:00+00', '11111111-1111-1111-1111-111111111111',
   'https://open.spotify.com/artist/4567890', 'https://soundcloud.com/charlottedewitte', now(), 'charlotte-de-witte'),
  -- July 13, 2025 (Saturday)
  ('a6666666-6666-6666-6666-666666666666', 'Stephan Bodzin', 'German techno producer and live performer', 
   'Main Stage', '2025-07-13 21:00:00+00', '2025-07-13 22:30:00+00', '11111111-1111-1111-1111-111111111111',
   'https://open.spotify.com/artist/5678901', 'https://soundcloud.com/stephanbodzin', now(), 'stephan-bodzin'),
  ('a7777777-7777-7777-7777-777777777777', 'Lane 8', 'American deep house and progressive house producer', 
   'Main Stage', '2025-07-13 19:00:00+00', '2025-07-13 20:30:00+00', '11111111-1111-1111-1111-111111111111',
   'https://open.spotify.com/artist/6789012', 'https://soundcloud.com/lane8music', now(), 'lane-8'),
  ('a8888888-8888-8888-8888-888888888888', 'Netsky', 'Belgian drum and bass producer', 
   'Club Stage', '2025-07-13 22:30:00+00', '2025-07-14 00:00:00+00', '11111111-1111-1111-1111-111111111111',
   'https://open.spotify.com/artist/7890123', 'https://soundcloud.com/netsky', now(), 'netsky'),
  ('a9999999-9999-9999-9999-999999999999', 'Bonobo', 'British downtempo and electronic artist', 
   'Ambient Garden', '2025-07-13 17:00:00+00', '2025-07-13 18:30:00+00', '11111111-1111-1111-1111-111111111111',
   'https://open.spotify.com/artist/8901234', 'https://soundcloud.com/bonobomusic', now(), 'bonobo'),
  ('aaaaaaa1-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Amelie Lens', 'Belgian techno DJ', 
   'Club Stage', '2025-07-14 00:00:00+00', '2025-07-14 01:30:00+00', '11111111-1111-1111-1111-111111111111',
   'https://open.spotify.com/artist/9012345', 'https://soundcloud.com/amelielens', now(), 'amelie-lens'),
  -- July 14, 2025 (Sunday)
  ('aaaaaaa2-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Maceo Plex', 'Cuban-American techno and house producer', 
   'Main Stage', '2025-07-14 20:00:00+00', '2025-07-14 21:30:00+00', '11111111-1111-1111-1111-111111111111',
   'https://open.spotify.com/artist/0123456', 'https://soundcloud.com/maceoplex', now(), 'maceo-plex'),
  ('aaaaaaa3-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Paul Kalkbrenner', 'German techno producer and live act', 
   'Main Stage', '2025-07-14 22:00:00+00', '2025-07-14 23:30:00+00', '11111111-1111-1111-1111-111111111111',
   'https://open.spotify.com/artist/1234567', 'https://soundcloud.com/paulkalkbrenner', now(), 'paul-kalkbrenner'),
  ('aaaaaaa4-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Ott', 'British dub and psychedelic producer', 
   'Ambient Garden', '2025-07-14 16:00:00+00', '2025-07-14 17:30:00+00', '11111111-1111-1111-1111-111111111111',
   'https://open.spotify.com/artist/2345678', 'https://soundcloud.com/ottsonic', now(), 'ott'),
  ('aaaaaaa5-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Hybrid Minds', 'British liquid drum and bass duo', 
   'Club Stage', '2025-07-14 19:00:00+00', '2025-07-14 20:30:00+00', '11111111-1111-1111-1111-111111111111',
   'https://open.spotify.com/artist/3456789', 'https://soundcloud.com/hybridminds', now(), 'hybrid-minds'),
  ('aaaaaaa6-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Tourist', 'British electronic music producer', 
   'Club Stage', '2025-07-14 17:30:00+00', '2025-07-14 18:30:00+00', '11111111-1111-1111-1111-111111111111',
   'https://open.spotify.com/artist/4567890', 'https://soundcloud.com/touristmusic', now(), 'tourist'),
  -- Additional artists for variety
  ('aaaaaaa7-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Four Tet', 'British electronic music producer', 
   'Ambient Garden', '2025-07-12 19:30:00+00', '2025-07-12 21:00:00+00', '11111111-1111-1111-1111-111111111111',
   'https://open.spotify.com/artist/5678901', 'https://soundcloud.com/fourtet', now(), 'four-tet'),
  ('aaaaaaa8-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Moderat', 'German electronic music group', 
   'Main Stage', '2025-07-12 16:00:00+00', '2025-07-12 17:30:00+00', '11111111-1111-1111-1111-111111111111',
   'https://open.spotify.com/artist/6789012', 'https://soundcloud.com/moderat-band', now(), 'moderat'),
  ('aaaaaaa9-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Disclosure', 'British electronic music duo', 
   'Main Stage', '2025-07-13 23:00:00+00', '2025-07-14 00:30:00+00', '11111111-1111-1111-1111-111111111111',
   'https://open.spotify.com/artist/7890123', 'https://soundcloud.com/disclosure', now(), 'disclosure'),
  ('aaaaaaab-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Shpongle', 'British psychedelic electronic duo', 
   'Ambient Garden', '2025-07-13 20:30:00+00', '2025-07-13 22:00:00+00', '11111111-1111-1111-1111-111111111111',
   'https://open.spotify.com/artist/8901234', 'https://soundcloud.com/shpongle', now(), 'shpongle'),
  ('aaaaaccc-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Floating Points', 'British electronic musician and neuroscientist', 
   'Club Stage', '2025-07-14 21:30:00+00', '2025-07-14 23:00:00+00', '11111111-1111-1111-1111-111111111111',
   'https://open.spotify.com/artist/9012345', 'https://soundcloud.com/floatingpoints', now(), 'floating-points');



-- Now insert artist-genre relationships
INSERT INTO public.artist_music_genres (artist_id, music_genre_id) VALUES
  ('a1111111-1111-1111-1111-111111111111', (SELECT id FROM music_genres WHERE name = 'House')),
  ('a2222222-2222-2222-2222-222222222222', (SELECT id FROM music_genres WHERE name = 'Progressive')),
  ('a3333333-3333-3333-3333-333333333333', (SELECT id FROM music_genres WHERE name = 'Techno')),
  ('a4444444-4444-4444-4444-444444444444', (SELECT id FROM music_genres WHERE name = 'Ambient')),
  ('a5555555-5555-5555-5555-555555555555', (SELECT id FROM music_genres WHERE name = 'Techno')),
  ('a6666666-6666-6666-6666-666666666666', (SELECT id FROM music_genres WHERE name = 'Techno')),
  ('a7777777-7777-7777-7777-777777777777', (SELECT id FROM music_genres WHERE name = 'Progressive')),
  ('a8888888-8888-8888-8888-888888888888', (SELECT id FROM music_genres WHERE name = 'Drum & Bass')),
  ('a9999999-9999-9999-9999-999999999999', (SELECT id FROM music_genres WHERE name = 'Downtempo')),
  ('aaaaaaa1-aaaa-aaaa-aaaa-aaaaaaaaaaaa', (SELECT id FROM music_genres WHERE name = 'Techno')),
  ('aaaaaaa2-aaaa-aaaa-aaaa-aaaaaaaaaaaa', (SELECT id FROM music_genres WHERE name = 'House')),
  ('aaaaaaa3-aaaa-aaaa-aaaa-aaaaaaaaaaaa', (SELECT id FROM music_genres WHERE name = 'Techno')),
  ('aaaaaaa4-aaaa-aaaa-aaaa-aaaaaaaaaaaa', (SELECT id FROM music_genres WHERE name = 'Dub')),
  ('aaaaaaa5-aaaa-aaaa-aaaa-aaaaaaaaaaaa', (SELECT id FROM music_genres WHERE name = 'Drum & Bass')),
  ('aaaaaaa6-aaaa-aaaa-aaaa-aaaaaaaaaaaa', (SELECT id FROM music_genres WHERE name = 'Electronic')),
  ('aaaaaaa7-aaaa-aaaa-aaaa-aaaaaaaaaaaa', (SELECT id FROM music_genres WHERE name = 'Electronic')),
  ('aaaaaaa8-aaaa-aaaa-aaaa-aaaaaaaaaaaa', (SELECT id FROM music_genres WHERE name = 'Electronic')),
  ('aaaaaaa9-aaaa-aaaa-aaaa-aaaaaaaaaaaa', (SELECT id FROM music_genres WHERE name = 'House')),
  ('aaaaaaab-aaaa-aaaa-aaaa-aaaaaaaaaaaa', (SELECT id FROM music_genres WHERE name = 'Experimental')),
  ('aaaaaccc-aaaa-aaaa-aaaa-aaaaaaaaaaaa', (SELECT id FROM music_genres WHERE name = 'Experimental'));

-- Insert festival (with unique slug to avoid conflicts)
INSERT INTO public.festivals (id, name, slug, description, published, created_at, updated_at) VALUES 
  ('f1111111-1111-1111-1111-111111111111', 'Test festival', 'test', 'Electronic music festival in beautiful Portuguese countryside', true, now(), now());

-- Update festival info with description and sample data (festival_info record already created by migration trigger)
UPDATE public.festival_info 
SET info_text = '<p>Psychedelic music festival in Portugal</p><p>Experience three days of electronic music in the beautiful Portuguese countryside. From techno to ambient, house to drum & bass, this festival celebrates the diverse spectrum of electronic music culture.</p>',
    facebook_url = 'https://facebook.com/testfestival',
    instagram_url = 'https://instagram.com/testfestival',
    updated_at = now()
WHERE festival_id = 'f1111111-1111-1111-1111-111111111111';

-- Insert sample custom links for the festival
INSERT INTO public.custom_links (festival_id, title, url, display_order, created_at, updated_at) VALUES 
  ('f1111111-1111-1111-1111-111111111111', 'Website', 'https://testfestival.com', 0, now(), now()),
  ('f1111111-1111-1111-1111-111111111111', 'Tickets', 'https://testfestival.com/tickets', 1, now(), now()),
  ('f1111111-1111-1111-1111-111111111111', 'Transport', 'https://testfestival.com/travel', 2, now(), now());

-- Insert festival edition
-- phase_override pins the derived festival phase to "live" so e2e voting
-- tests stay stable regardless of how far the seeded 2025 dates drift into
-- the past relative to real wall-clock time (see ADR-0003, ADR-0004).
INSERT INTO public.festival_editions (id, festival_id, year, slug, name, description, location, start_date, end_date, published, schedule_reveal_level, phase_override, created_at, updated_at) VALUES
  ('e1111111-1111-1111-1111-111111111111', 'f1111111-1111-1111-1111-111111111111', 2025, '2025', 'Boom Festival 2025', 'The 2025 edition of Boom Festival', 'Idanha-a-Nova, Portugal', '2025-07-12', '2025-07-14', true, 'full', 'live', now(), now());

-- Insert stages
INSERT INTO public.stages (id, name, slug, festival_edition_id, created_at, updated_at) VALUES
  ('11111111-1111-1111-1111-11111111111a', 'Main Stage', 'main-stage', 'e1111111-1111-1111-1111-111111111111', now(), now()),
  ('22222222-2222-2222-2222-22222222222b', 'Club Stage', 'club-stage', 'e1111111-1111-1111-1111-111111111111', now(), now()),
  ('33333333-3333-3333-3333-33333333333c', 'Ambient Garden', 'ambient-garden', 'e1111111-1111-1111-1111-111111111111', now(), now());

-- Second festival + edition dedicated to Post-Festival phase e2e coverage
-- (rating.spec.ts). Kept separate from "Boom Festival 2025" above so the
-- voting suite's phase_override = 'live' never has to fight with the
-- rating suite's phase_override = 'post-festival' on the same row.
INSERT INTO public.festivals (id, name, slug, description, published, created_at, updated_at) VALUES
  ('f2222222-2222-2222-2222-222222222222', 'Post Festival Test', 'post-test', 'Festival edition used to test the Post-Festival retrospective rating UI', true, now(), now());

INSERT INTO public.festival_editions (id, festival_id, year, slug, name, description, location, start_date, end_date, published, schedule_reveal_level, phase_override, created_at, updated_at) VALUES
  ('e2222222-2222-2222-2222-222222222222', 'f2222222-2222-2222-2222-222222222222', 2025, '2025', 'Post Festival Test 2025', 'Edition pinned to the post-festival phase for rating e2e tests', 'Idanha-a-Nova, Portugal', '2025-07-12', '2025-07-14', true, 'full', 'post-festival', now(), now());

INSERT INTO public.stages (id, name, slug, festival_edition_id, created_at, updated_at) VALUES
  ('21111111-1111-1111-1111-11111111111a', 'Main Stage', 'main-stage', 'e2222222-2222-2222-2222-222222222222', now(), now());

-- Four distinct sets, one per rating.spec.ts scenario, so parallel/serial
-- tests never race over the same set_ratings row (mirrors voting.spec.ts).
INSERT INTO public.sets (id, name, slug, festival_edition_id, stage_id, time_start, time_end, description, created_by, created_at, updated_at) VALUES
  ('21111111-1111-1111-1111-111111111111', 'Maya Jane Coles', 'maya-jane-coles-set', 'e2222222-2222-2222-2222-222222222222', '21111111-1111-1111-1111-11111111111a', '2025-07-12 22:00:00+00', '2025-07-12 23:30:00+00', 'British DJ and producer known for her deep house and techno sets', '11111111-1111-1111-1111-111111111111', now(), now()),
  ('22222222-2222-2222-2222-222222222223', 'Ben Böhmer', 'ben-bohmer-set', 'e2222222-2222-2222-2222-222222222222', '21111111-1111-1111-1111-11111111111a', '2025-07-12 20:00:00+00', '2025-07-12 21:30:00+00', 'German melodic house and techno producer', '11111111-1111-1111-1111-111111111111', now(), now()),
  ('23333333-3333-3333-3333-333333333333', 'Kiara Scuro', 'kiara-scuro-set', 'e2222222-2222-2222-2222-222222222222', '21111111-1111-1111-1111-11111111111a', '2025-07-12 23:30:00+00', '2025-07-13 01:00:00+00', 'Rising star in dark techno', '11111111-1111-1111-1111-111111111111', now(), now()),
  ('24444444-4444-4444-4444-444444444444', 'Nils Frahm', 'nils-frahm-set', 'e2222222-2222-2222-2222-222222222222', '21111111-1111-1111-1111-11111111111a', '2025-07-12 18:00:00+00', '2025-07-12 19:30:00+00', 'Ambient electronic composer and pianist', '11111111-1111-1111-1111-111111111111', now(), now());

INSERT INTO public.set_artists (set_id, artist_id, role, created_at) VALUES
  ('21111111-1111-1111-1111-111111111111', 'a1111111-1111-1111-1111-111111111111', 'performer', now()),
  ('22222222-2222-2222-2222-222222222223', 'a2222222-2222-2222-2222-222222222222', 'performer', now()),
  ('23333333-3333-3333-3333-333333333333', 'a3333333-3333-3333-3333-333333333333', 'performer', now()),
  ('24444444-4444-4444-4444-444444444444', 'a4444444-4444-4444-4444-444444444444', 'performer', now());

-- Insert sets (one for each artist, using their name and schedule)
INSERT INTO public.sets (id, name, slug, festival_edition_id, stage_id, time_start, time_end, description, created_by, created_at, updated_at) VALUES 
  -- Friday July 12, 2025
  ('11111111-1111-1111-1111-111111111111', 'Maya Jane Coles', 'maya-jane-coles-set', 'e1111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-11111111111a', '2025-07-12 22:00:00+00', '2025-07-12 23:30:00+00', 'British DJ and producer known for her deep house and techno sets', '11111111-1111-1111-1111-111111111111', now(), now()),
  ('22222222-2222-2222-2222-222222222222', 'Ben Böhmer', 'ben-bohmer-set', 'e1111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-22222222222b', '2025-07-12 20:00:00+00', '2025-07-12 21:30:00+00', 'German melodic house and techno producer', '11111111-1111-1111-1111-111111111111', now(), now()),
  ('33333333-3333-3333-3333-333333333333', 'Kiara Scuro', 'kiara-scuro-set', 'e1111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-22222222222b', '2025-07-12 23:30:00+00', '2025-07-13 01:00:00+00', 'Rising star in dark techno', '11111111-1111-1111-1111-111111111111', now(), now()),
  ('44444444-4444-4444-4444-444444444444', 'Nils Frahm', 'nils-frahm-set', 'e1111111-1111-1111-1111-111111111111', '33333333-3333-3333-3333-33333333333c', '2025-07-12 18:00:00+00', '2025-07-12 19:30:00+00', 'Ambient electronic composer and pianist', '11111111-1111-1111-1111-111111111111', now(), now()),
  ('55555555-5555-5555-5555-555555555555', 'Charlotte de Witte', 'charlotte-de-witte-set', 'e1111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-11111111111a', '2025-07-13 01:00:00+00', '2025-07-13 02:30:00+00', 'Belgian techno DJ and producer', '11111111-1111-1111-1111-111111111111', now(), now()),
  ('77777777-7777-7777-7777-777777777777', 'Four Tet', 'four-tet-set', 'e1111111-1111-1111-1111-111111111111', '33333333-3333-3333-3333-33333333333c', '2025-07-12 19:30:00+00', '2025-07-12 21:00:00+00', 'British electronic music producer', '11111111-1111-1111-1111-111111111111', now(), now()),
  ('88888888-8888-8888-8888-888888888888', 'Moderat', 'moderat-set', 'e1111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-11111111111a', '2025-07-12 16:00:00+00', '2025-07-12 17:30:00+00', 'German electronic music group', '11111111-1111-1111-1111-111111111111', now(), now()),
  
  -- Saturday July 13, 2025
  ('66666666-6666-6666-6666-666666666666', 'Stephan Bodzin', 'stephan-bodzin-set', 'e1111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-11111111111a', '2025-07-13 21:00:00+00', '2025-07-13 22:30:00+00', 'German techno producer and live performer', '11111111-1111-1111-1111-111111111111', now(), now()),
  ('99999999-9999-9999-9999-999999999999', 'Lane 8', 'lane-8-set', 'e1111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-11111111111a', '2025-07-13 19:00:00+00', '2025-07-13 20:30:00+00', 'American deep house and progressive house producer', '11111111-1111-1111-1111-111111111111', now(), now()),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Netsky', 'netsky-set', 'e1111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-22222222222b', '2025-07-13 22:30:00+00', '2025-07-14 00:00:00+00', 'Belgian drum and bass producer', '11111111-1111-1111-1111-111111111111', now(), now()),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Bonobo', 'bonobo-set', 'e1111111-1111-1111-1111-111111111111', '33333333-3333-3333-3333-33333333333c', '2025-07-13 17:00:00+00', '2025-07-13 18:30:00+00', 'British downtempo and electronic artist', '11111111-1111-1111-1111-111111111111', now(), now()),
  ('cccccccc-cccc-cccc-cccc-cccccccccccc', 'Amelie Lens', 'amelie-lens-set', 'e1111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-22222222222b', '2025-07-14 00:00:00+00', '2025-07-14 01:30:00+00', 'Belgian techno DJ', '11111111-1111-1111-1111-111111111111', now(), now()),
  ('dddddddd-dddd-dddd-dddd-dddddddddddd', 'Disclosure', 'disclosure-set', 'e1111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-11111111111a', '2025-07-13 23:00:00+00', '2025-07-14 00:30:00+00', 'British electronic music duo', '11111111-1111-1111-1111-111111111111', now(), now()),
  ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'Shpongle', 'shpongle-set', 'e1111111-1111-1111-1111-111111111111', '33333333-3333-3333-3333-33333333333c', '2025-07-13 20:30:00+00', '2025-07-13 22:00:00+00', 'British psychedelic electronic duo', '11111111-1111-1111-1111-111111111111', now(), now()),
  
  -- Sunday July 14, 2025  
  ('ffffffff-ffff-ffff-ffff-ffffffffffff', 'Maceo Plex', 'maceo-plex-set', 'e1111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-11111111111a', '2025-07-14 20:00:00+00', '2025-07-14 21:30:00+00', 'Cuban-American techno and house producer', '11111111-1111-1111-1111-111111111111', now(), now()),
  ('aaaaaaab-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Paul Kalkbrenner', 'paul-kalkbrenner-set', 'e1111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-11111111111a', '2025-07-14 22:00:00+00', '2025-07-14 23:30:00+00', 'German techno producer and live act', '11111111-1111-1111-1111-111111111111', now(), now()),
  ('aaaaaaac-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Ott', 'ott-set', 'e1111111-1111-1111-1111-111111111111', '33333333-3333-3333-3333-33333333333c', '2025-07-14 16:00:00+00', '2025-07-14 17:30:00+00', 'British dub and psychedelic producer', '11111111-1111-1111-1111-111111111111', now(), now()),
  ('aaaaaaad-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Hybrid Minds', 'hybrid-minds-set', 'e1111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-22222222222b', '2025-07-14 19:00:00+00', '2025-07-14 20:30:00+00', 'British liquid drum and bass duo', '11111111-1111-1111-1111-111111111111', now(), now()),
  ('aaaaaaae-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Tourist', 'tourist-set', 'e1111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-22222222222b', '2025-07-14 17:30:00+00', '2025-07-14 18:30:00+00', 'British electronic music producer', '11111111-1111-1111-1111-111111111111', now(), now()),
  ('aaaaaaaf-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Floating Points', 'floating-points-set', 'e1111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-22222222222b', '2025-07-14 21:30:00+00', '2025-07-14 23:00:00+00', 'British electronic musician and neuroscientist', '11111111-1111-1111-1111-111111111111', now(), now());

-- Link each artist to their corresponding set
INSERT INTO public.set_artists (set_id, artist_id, role, created_at) VALUES 
  ('11111111-1111-1111-1111-111111111111', 'a1111111-1111-1111-1111-111111111111', 'performer', now()),
  ('22222222-2222-2222-2222-222222222222', 'a2222222-2222-2222-2222-222222222222', 'performer', now()),
  ('33333333-3333-3333-3333-333333333333', 'a3333333-3333-3333-3333-333333333333', 'performer', now()),
  ('44444444-4444-4444-4444-444444444444', 'a4444444-4444-4444-4444-444444444444', 'performer', now()),
  ('55555555-5555-5555-5555-555555555555', 'a5555555-5555-5555-5555-555555555555', 'performer', now()),
  ('66666666-6666-6666-6666-666666666666', 'a6666666-6666-6666-6666-666666666666', 'performer', now()),
  ('99999999-9999-9999-9999-999999999999', 'a7777777-7777-7777-7777-777777777777', 'performer', now()),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'a8888888-8888-8888-8888-888888888888', 'performer', now()),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'a9999999-9999-9999-9999-999999999999', 'performer', now()),
  ('cccccccc-cccc-cccc-cccc-cccccccccccc', 'aaaaaaa1-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'performer', now()),
  ('ffffffff-ffff-ffff-ffff-ffffffffffff', 'aaaaaaa2-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'performer', now()),
  ('aaaaaaab-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'aaaaaaa3-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'performer', now()),
  ('aaaaaaac-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'aaaaaaa4-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'performer', now()),
  ('aaaaaaad-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'aaaaaaa5-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'performer', now()),
  ('aaaaaaae-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'aaaaaaa6-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'performer', now()),
  ('77777777-7777-7777-7777-777777777777', 'aaaaaaa7-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'performer', now()),
  ('88888888-8888-8888-8888-888888888888', 'aaaaaaa8-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'performer', now()),
  ('dddddddd-dddd-dddd-dddd-dddddddddddd', 'aaaaaaa9-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'performer', now()),
  ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'aaaaaaab-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'performer', now()),
  ('aaaaaaaf-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'aaaaaccc-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'performer', now());

-- Insert sample artist notes
INSERT INTO public.artist_notes (user_id, artist_id, note_content, created_at) VALUES 
  ('11111111-1111-1111-1111-111111111111', 'a1111111-1111-1111-1111-111111111111', 'Absolutely incredible live performer! Her set at Fabric was life-changing.', now()),
  ('11111111-1111-1111-1111-111111111111', 'a7777777-7777-7777-7777-777777777777', 'Perfect for sunset vibes. His melodic progressions are unmatched.', now()),
  ('11111111-1111-1111-1111-111111111111', 'a5555555-5555-5555-5555-555555555555', 'Raw, powerful techno. Always brings the energy!', now()),
  ('11111111-1111-1111-1111-111111111111', 'a6666666-6666-6666-6666-666666666666', 'His live setup is incredible. Real instruments mixed with electronic production.', now()),
  ('11111111-1111-1111-1111-111111111111', 'a4444444-4444-4444-4444-444444444444', 'Perfect for late night ambient sessions. Very meditative.', now()),
  ('11111111-1111-1111-1111-111111111111', 'a8888888-8888-8888-8888-888888888888', 'Belgian bass master! His liquid DnB sets are smooth as silk.', now()),
  ('11111111-1111-1111-1111-111111111111', 'a2222222-2222-2222-2222-222222222222', 'Melodic house perfection. Every track tells a story.', now()),
  ('11111111-1111-1111-1111-111111111111', 'a9999999-9999-9999-9999-999999999999', 'Simon is a genius. His live band setup brings electronic music to life.', now()),
  ('11111111-1111-1111-1111-111111111111', 'aaaaaaa5-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Best liquid DnB in the scene right now. Their Hospital Records releases are gold.', now()),
  ('11111111-1111-1111-1111-111111111111', 'aaaaaaa9-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'UK garage meets house perfection. Brothers know how to move a crowd!', now());

-- Dedicated fixtures for schedule reveal level e2e tests (tests/e2e/schedule-reveal-levels.spec.ts).
-- One festival with four editions, one per schedule_reveal_level, so parallel
-- test workers never need to mutate a shared row - each edition is read-only.
INSERT INTO public.festivals (id, name, slug, description, published, created_at, updated_at) VALUES
  ('c1000000-0000-0000-0000-000000000001', 'Reveal Test Festival', 'reveal-test', 'Fixture festival for schedule reveal level e2e tests', true, now(), now());

INSERT INTO public.festival_editions (id, festival_id, year, slug, name, description, location, start_date, end_date, published, schedule_reveal_level, created_at, updated_at) VALUES
  ('c2000000-0000-0000-0000-000000000001', 'c1000000-0000-0000-0000-000000000001', 2099, 'draft', 'Reveal Test - Draft', 'Draft reveal level fixture', 'Nowhere', '2099-07-01', '2099-07-03', true, 'draft', now(), now()),
  ('c2000000-0000-0000-0000-000000000002', 'c1000000-0000-0000-0000-000000000001', 2099, 'days', 'Reveal Test - Days', 'Days reveal level fixture', 'Nowhere', '2099-07-01', '2099-07-03', true, 'days', now(), now()),
  ('c2000000-0000-0000-0000-000000000003', 'c1000000-0000-0000-0000-000000000001', 2099, 'stages', 'Reveal Test - Stages', 'Stages reveal level fixture', 'Nowhere', '2099-07-01', '2099-07-03', true, 'stages', now(), now()),
  ('c2000000-0000-0000-0000-000000000004', 'c1000000-0000-0000-0000-000000000001', 2099, 'full', 'Reveal Test - Full', 'Full reveal level fixture', 'Nowhere', '2099-07-01', '2099-07-03', true, 'full', now(), now());

-- Wipe any previously-seeded fixture stages/sets for this festival's
-- editions first, so this block is safe to re-run even after an older
-- version of these fixtures (different ids/slugs) already ran once.
-- Deletes sets before stages (sets.stage_id has no ON DELETE CASCADE);
-- set_artists and votes cascade automatically off sets.
DELETE FROM public.sets WHERE festival_edition_id IN (
  'c2000000-0000-0000-0000-000000000001',
  'c2000000-0000-0000-0000-000000000002',
  'c2000000-0000-0000-0000-000000000003',
  'c2000000-0000-0000-0000-000000000004'
);
DELETE FROM public.stages WHERE festival_edition_id IN (
  'c2000000-0000-0000-0000-000000000001',
  'c2000000-0000-0000-0000-000000000002',
  'c2000000-0000-0000-0000-000000000003',
  'c2000000-0000-0000-0000-000000000004'
);

-- Fixture artists shared by the days/stages sets below, plus the
-- pre-existing "full" edition's set (its artist is the first row).
INSERT INTO public.artists (id, name, slug, added_by, created_at, updated_at) VALUES
  ('c5000000-0000-0000-0000-000000000001', 'Fixture Artist', 'fixture-artist-fixture', '11111111-1111-1111-1111-111111111111', now(), now()),
  ('c5000000-0000-0000-0000-000000000002', 'Nova Circuit', 'nova-circuit-fixture', '11111111-1111-1111-1111-111111111111', now(), now()),
  ('c5000000-0000-0000-0000-000000000003', 'Echo Bloom', 'echo-bloom-fixture', '11111111-1111-1111-1111-111111111111', now(), now()),
  ('c5000000-0000-0000-0000-000000000004', 'Velvet Static', 'velvet-static-fixture', '11111111-1111-1111-1111-111111111111', now(), now()),
  ('c5000000-0000-0000-0000-000000000005', 'Glass Horizon', 'glass-horizon-fixture', '11111111-1111-1111-1111-111111111111', now(), now()),
  ('c5000000-0000-0000-0000-000000000006', 'Solar Undertow', 'solar-undertow-fixture', '11111111-1111-1111-1111-111111111111', now(), now()),
  ('c5000000-0000-0000-0000-000000000007', 'Midnight Choir', 'midnight-choir-fixture', '11111111-1111-1111-1111-111111111111', now(), now()),
  ('c5000000-0000-0000-0000-000000000008', 'Paper Moon Collective', 'paper-moon-collective-fixture', '11111111-1111-1111-1111-111111111111', now(), now()),
  ('c5000000-0000-0000-0000-000000000009', 'Amber Frequency', 'amber-frequency-fixture', '11111111-1111-1111-1111-111111111111', now(), now()),
  ('c5000000-0000-0000-0000-00000000000a', 'Wire & Wax', 'wire-wax-fixture', '11111111-1111-1111-1111-111111111111', now(), now()),
  ('c5000000-0000-0000-0000-00000000000b', 'Hollow Pines', 'hollow-pines-fixture', '11111111-1111-1111-1111-111111111111', now(), now()),
  ('c5000000-0000-0000-0000-00000000000c', 'Neon Marrow', 'neon-marrow-fixture', '11111111-1111-1111-1111-111111111111', now(), now()),
  ('c5000000-0000-0000-0000-00000000000d', 'Salt Cathedral', 'salt-cathedral-fixture', '11111111-1111-1111-1111-111111111111', now(), now()),
  ('c5000000-0000-0000-0000-00000000000e', 'Quiet Machine', 'quiet-machine-fixture', '11111111-1111-1111-1111-111111111111', now(), now()),
  ('c5000000-0000-0000-0000-00000000000f', 'Firelight District', 'firelight-district-fixture', '11111111-1111-1111-1111-111111111111', now(), now()),
  ('c5000000-0000-0000-0000-000000000010', 'Copper Bloom', 'copper-bloom-fixture', '11111111-1111-1111-1111-111111111111', now(), now()),
  ('c5000000-0000-0000-0000-000000000011', 'Drift King', 'drift-king-fixture', '11111111-1111-1111-1111-111111111111', now(), now()),
  ('c5000000-0000-0000-0000-000000000012', 'Violet Static', 'violet-static-fixture', '11111111-1111-1111-1111-111111111111', now(), now())
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.stages (id, name, slug, festival_edition_id, created_at, updated_at) VALUES
  ('c3000000-0000-0000-0000-000000000064', 'Fixture Stage', 'fixture-stage', 'c2000000-0000-0000-0000-000000000002', now(), now()),
  ('c3000000-0000-0000-0000-000000000065', 'Forest Stage', 'forest-stage', 'c2000000-0000-0000-0000-000000000002', now(), now()),
  ('c3000000-0000-0000-0000-000000000066', 'Lake Stage', 'lake-stage', 'c2000000-0000-0000-0000-000000000002', now(), now()),
  ('c3000000-0000-0000-0000-0000000000c8', 'Fixture Stage', 'fixture-stage', 'c2000000-0000-0000-0000-000000000003', now(), now()),
  ('c3000000-0000-0000-0000-0000000000c9', 'Forest Stage', 'forest-stage', 'c2000000-0000-0000-0000-000000000003', now(), now()),
  ('c3000000-0000-0000-0000-0000000000ca', 'Lake Stage', 'lake-stage', 'c2000000-0000-0000-0000-000000000003', now(), now()),
  ('c3000000-0000-0000-0000-000000000004', 'Fixture Stage', 'fixture-stage', 'c2000000-0000-0000-0000-000000000004', now(), now());

-- "days" and "stages" editions each get 3 stages x 3 days x 2 sets so
-- the day-grouped lineup and stage x day grid both have plenty to show.
-- No sets for the "draft" edition: at that level the schedule tab is
-- expected to short-circuit to the not-revealed placeholder before ever
-- reading sets. Every set below is linked to an artist via set_artists
-- so it also shows up on the Sets/Vote tab, which filters out sets
-- without an artist.
INSERT INTO public.sets (id, name, slug, festival_edition_id, stage_id, time_start, time_end, description, created_by, created_at, updated_at) VALUES
  ('c4000000-0000-0000-0000-000000000001', 'Fixture Set Days', 'fixture-set-days', 'c2000000-0000-0000-0000-000000000002', 'c3000000-0000-0000-0000-000000000064', '2099-07-01 18:00:00+00', '2099-07-01 19:00:00+00', 'Fixture set for days reveal level', '11111111-1111-1111-1111-111111111111', now(), now()),
  ('c4000000-0000-0000-0000-000000000002', 'Nova Circuit', 'nova-circuit-days', 'c2000000-0000-0000-0000-000000000002', 'c3000000-0000-0000-0000-000000000064', '2099-07-01 20:00:00+00', '2099-07-01 21:00:00+00', 'Fixture set for days reveal level', '11111111-1111-1111-1111-111111111111', now(), now()),
  ('c4000000-0000-0000-0000-000000000003', 'Echo Bloom', 'echo-bloom-days', 'c2000000-0000-0000-0000-000000000002', 'c3000000-0000-0000-0000-000000000064', '2099-07-02 18:00:00+00', '2099-07-02 19:00:00+00', 'Fixture set for days reveal level', '11111111-1111-1111-1111-111111111111', now(), now()),
  ('c4000000-0000-0000-0000-000000000004', 'Velvet Static', 'velvet-static-days', 'c2000000-0000-0000-0000-000000000002', 'c3000000-0000-0000-0000-000000000064', '2099-07-02 20:00:00+00', '2099-07-02 21:00:00+00', 'Fixture set for days reveal level', '11111111-1111-1111-1111-111111111111', now(), now()),
  ('c4000000-0000-0000-0000-000000000005', 'Glass Horizon', 'glass-horizon-days', 'c2000000-0000-0000-0000-000000000002', 'c3000000-0000-0000-0000-000000000064', '2099-07-03 18:00:00+00', '2099-07-03 19:00:00+00', 'Fixture set for days reveal level', '11111111-1111-1111-1111-111111111111', now(), now()),
  ('c4000000-0000-0000-0000-000000000006', 'Solar Undertow', 'solar-undertow-days', 'c2000000-0000-0000-0000-000000000002', 'c3000000-0000-0000-0000-000000000064', '2099-07-03 20:00:00+00', '2099-07-03 21:00:00+00', 'Fixture set for days reveal level', '11111111-1111-1111-1111-111111111111', now(), now()),
  ('c4000000-0000-0000-0000-000000000007', 'Midnight Choir', 'midnight-choir-days', 'c2000000-0000-0000-0000-000000000002', 'c3000000-0000-0000-0000-000000000065', '2099-07-01 18:00:00+00', '2099-07-01 19:00:00+00', 'Fixture set for days reveal level', '11111111-1111-1111-1111-111111111111', now(), now()),
  ('c4000000-0000-0000-0000-000000000008', 'Paper Moon Collective', 'paper-moon-collective-days', 'c2000000-0000-0000-0000-000000000002', 'c3000000-0000-0000-0000-000000000065', '2099-07-01 20:00:00+00', '2099-07-01 21:00:00+00', 'Fixture set for days reveal level', '11111111-1111-1111-1111-111111111111', now(), now()),
  ('c4000000-0000-0000-0000-000000000009', 'Amber Frequency', 'amber-frequency-days', 'c2000000-0000-0000-0000-000000000002', 'c3000000-0000-0000-0000-000000000065', '2099-07-02 18:00:00+00', '2099-07-02 19:00:00+00', 'Fixture set for days reveal level', '11111111-1111-1111-1111-111111111111', now(), now()),
  ('c4000000-0000-0000-0000-00000000000a', 'Wire & Wax', 'wire-wax-days', 'c2000000-0000-0000-0000-000000000002', 'c3000000-0000-0000-0000-000000000065', '2099-07-02 20:00:00+00', '2099-07-02 21:00:00+00', 'Fixture set for days reveal level', '11111111-1111-1111-1111-111111111111', now(), now()),
  ('c4000000-0000-0000-0000-00000000000b', 'Hollow Pines', 'hollow-pines-days', 'c2000000-0000-0000-0000-000000000002', 'c3000000-0000-0000-0000-000000000065', '2099-07-03 18:00:00+00', '2099-07-03 19:00:00+00', 'Fixture set for days reveal level', '11111111-1111-1111-1111-111111111111', now(), now()),
  ('c4000000-0000-0000-0000-00000000000c', 'Neon Marrow', 'neon-marrow-days', 'c2000000-0000-0000-0000-000000000002', 'c3000000-0000-0000-0000-000000000065', '2099-07-03 20:00:00+00', '2099-07-03 21:00:00+00', 'Fixture set for days reveal level', '11111111-1111-1111-1111-111111111111', now(), now()),
  ('c4000000-0000-0000-0000-00000000000d', 'Salt Cathedral', 'salt-cathedral-days', 'c2000000-0000-0000-0000-000000000002', 'c3000000-0000-0000-0000-000000000066', '2099-07-01 18:00:00+00', '2099-07-01 19:00:00+00', 'Fixture set for days reveal level', '11111111-1111-1111-1111-111111111111', now(), now()),
  ('c4000000-0000-0000-0000-00000000000e', 'Quiet Machine', 'quiet-machine-days', 'c2000000-0000-0000-0000-000000000002', 'c3000000-0000-0000-0000-000000000066', '2099-07-01 20:00:00+00', '2099-07-01 21:00:00+00', 'Fixture set for days reveal level', '11111111-1111-1111-1111-111111111111', now(), now()),
  ('c4000000-0000-0000-0000-00000000000f', 'Firelight District', 'firelight-district-days', 'c2000000-0000-0000-0000-000000000002', 'c3000000-0000-0000-0000-000000000066', '2099-07-02 18:00:00+00', '2099-07-02 19:00:00+00', 'Fixture set for days reveal level', '11111111-1111-1111-1111-111111111111', now(), now()),
  ('c4000000-0000-0000-0000-000000000010', 'Copper Bloom', 'copper-bloom-days', 'c2000000-0000-0000-0000-000000000002', 'c3000000-0000-0000-0000-000000000066', '2099-07-02 20:00:00+00', '2099-07-02 21:00:00+00', 'Fixture set for days reveal level', '11111111-1111-1111-1111-111111111111', now(), now()),
  ('c4000000-0000-0000-0000-000000000011', 'Drift King', 'drift-king-days', 'c2000000-0000-0000-0000-000000000002', 'c3000000-0000-0000-0000-000000000066', '2099-07-03 18:00:00+00', '2099-07-03 19:00:00+00', 'Fixture set for days reveal level', '11111111-1111-1111-1111-111111111111', now(), now()),
  ('c4000000-0000-0000-0000-000000000012', 'Violet Static', 'violet-static-days', 'c2000000-0000-0000-0000-000000000002', 'c3000000-0000-0000-0000-000000000066', '2099-07-03 20:00:00+00', '2099-07-03 21:00:00+00', 'Fixture set for days reveal level', '11111111-1111-1111-1111-111111111111', now(), now()),
  ('c4000000-0000-0000-0000-000000000065', 'Fixture Set Stages', 'fixture-set-stages', 'c2000000-0000-0000-0000-000000000003', 'c3000000-0000-0000-0000-0000000000c8', '2099-07-01 18:00:00+00', '2099-07-01 19:00:00+00', 'Fixture set for stages reveal level', '11111111-1111-1111-1111-111111111111', now(), now()),
  ('c4000000-0000-0000-0000-000000000066', 'Nova Circuit', 'nova-circuit-stages', 'c2000000-0000-0000-0000-000000000003', 'c3000000-0000-0000-0000-0000000000c8', '2099-07-01 20:00:00+00', '2099-07-01 21:00:00+00', 'Fixture set for stages reveal level', '11111111-1111-1111-1111-111111111111', now(), now()),
  ('c4000000-0000-0000-0000-000000000067', 'Echo Bloom', 'echo-bloom-stages', 'c2000000-0000-0000-0000-000000000003', 'c3000000-0000-0000-0000-0000000000c8', '2099-07-02 18:00:00+00', '2099-07-02 19:00:00+00', 'Fixture set for stages reveal level', '11111111-1111-1111-1111-111111111111', now(), now()),
  ('c4000000-0000-0000-0000-000000000068', 'Velvet Static', 'velvet-static-stages', 'c2000000-0000-0000-0000-000000000003', 'c3000000-0000-0000-0000-0000000000c8', '2099-07-02 20:00:00+00', '2099-07-02 21:00:00+00', 'Fixture set for stages reveal level', '11111111-1111-1111-1111-111111111111', now(), now()),
  ('c4000000-0000-0000-0000-000000000069', 'Glass Horizon', 'glass-horizon-stages', 'c2000000-0000-0000-0000-000000000003', 'c3000000-0000-0000-0000-0000000000c8', '2099-07-03 18:00:00+00', '2099-07-03 19:00:00+00', 'Fixture set for stages reveal level', '11111111-1111-1111-1111-111111111111', now(), now()),
  ('c4000000-0000-0000-0000-00000000006a', 'Solar Undertow', 'solar-undertow-stages', 'c2000000-0000-0000-0000-000000000003', 'c3000000-0000-0000-0000-0000000000c8', '2099-07-03 20:00:00+00', '2099-07-03 21:00:00+00', 'Fixture set for stages reveal level', '11111111-1111-1111-1111-111111111111', now(), now()),
  ('c4000000-0000-0000-0000-00000000006b', 'Midnight Choir', 'midnight-choir-stages', 'c2000000-0000-0000-0000-000000000003', 'c3000000-0000-0000-0000-0000000000c9', '2099-07-01 18:00:00+00', '2099-07-01 19:00:00+00', 'Fixture set for stages reveal level', '11111111-1111-1111-1111-111111111111', now(), now()),
  ('c4000000-0000-0000-0000-00000000006c', 'Paper Moon Collective', 'paper-moon-collective-stages', 'c2000000-0000-0000-0000-000000000003', 'c3000000-0000-0000-0000-0000000000c9', '2099-07-01 20:00:00+00', '2099-07-01 21:00:00+00', 'Fixture set for stages reveal level', '11111111-1111-1111-1111-111111111111', now(), now()),
  ('c4000000-0000-0000-0000-00000000006d', 'Amber Frequency', 'amber-frequency-stages', 'c2000000-0000-0000-0000-000000000003', 'c3000000-0000-0000-0000-0000000000c9', '2099-07-02 18:00:00+00', '2099-07-02 19:00:00+00', 'Fixture set for stages reveal level', '11111111-1111-1111-1111-111111111111', now(), now()),
  ('c4000000-0000-0000-0000-00000000006e', 'Wire & Wax', 'wire-wax-stages', 'c2000000-0000-0000-0000-000000000003', 'c3000000-0000-0000-0000-0000000000c9', '2099-07-02 20:00:00+00', '2099-07-02 21:00:00+00', 'Fixture set for stages reveal level', '11111111-1111-1111-1111-111111111111', now(), now()),
  ('c4000000-0000-0000-0000-00000000006f', 'Hollow Pines', 'hollow-pines-stages', 'c2000000-0000-0000-0000-000000000003', 'c3000000-0000-0000-0000-0000000000c9', '2099-07-03 18:00:00+00', '2099-07-03 19:00:00+00', 'Fixture set for stages reveal level', '11111111-1111-1111-1111-111111111111', now(), now()),
  ('c4000000-0000-0000-0000-000000000070', 'Neon Marrow', 'neon-marrow-stages', 'c2000000-0000-0000-0000-000000000003', 'c3000000-0000-0000-0000-0000000000c9', '2099-07-03 20:00:00+00', '2099-07-03 21:00:00+00', 'Fixture set for stages reveal level', '11111111-1111-1111-1111-111111111111', now(), now()),
  ('c4000000-0000-0000-0000-000000000071', 'Salt Cathedral', 'salt-cathedral-stages', 'c2000000-0000-0000-0000-000000000003', 'c3000000-0000-0000-0000-0000000000ca', '2099-07-01 18:00:00+00', '2099-07-01 19:00:00+00', 'Fixture set for stages reveal level', '11111111-1111-1111-1111-111111111111', now(), now()),
  ('c4000000-0000-0000-0000-000000000072', 'Quiet Machine', 'quiet-machine-stages', 'c2000000-0000-0000-0000-000000000003', 'c3000000-0000-0000-0000-0000000000ca', '2099-07-01 20:00:00+00', '2099-07-01 21:00:00+00', 'Fixture set for stages reveal level', '11111111-1111-1111-1111-111111111111', now(), now()),
  ('c4000000-0000-0000-0000-000000000073', 'Firelight District', 'firelight-district-stages', 'c2000000-0000-0000-0000-000000000003', 'c3000000-0000-0000-0000-0000000000ca', '2099-07-02 18:00:00+00', '2099-07-02 19:00:00+00', 'Fixture set for stages reveal level', '11111111-1111-1111-1111-111111111111', now(), now()),
  ('c4000000-0000-0000-0000-000000000074', 'Copper Bloom', 'copper-bloom-stages', 'c2000000-0000-0000-0000-000000000003', 'c3000000-0000-0000-0000-0000000000ca', '2099-07-02 20:00:00+00', '2099-07-02 21:00:00+00', 'Fixture set for stages reveal level', '11111111-1111-1111-1111-111111111111', now(), now()),
  ('c4000000-0000-0000-0000-000000000075', 'Drift King', 'drift-king-stages', 'c2000000-0000-0000-0000-000000000003', 'c3000000-0000-0000-0000-0000000000ca', '2099-07-03 18:00:00+00', '2099-07-03 19:00:00+00', 'Fixture set for stages reveal level', '11111111-1111-1111-1111-111111111111', now(), now()),
  ('c4000000-0000-0000-0000-000000000076', 'Violet Static', 'violet-static-stages', 'c2000000-0000-0000-0000-000000000003', 'c3000000-0000-0000-0000-0000000000ca', '2099-07-03 20:00:00+00', '2099-07-03 21:00:00+00', 'Fixture set for stages reveal level', '11111111-1111-1111-1111-111111111111', now(), now()),
  ('c4000000-0000-0000-0000-000000000fff', 'Fixture Set Full', 'fixture-set-full', 'c2000000-0000-0000-0000-000000000004', 'c3000000-0000-0000-0000-000000000004', '2099-07-01 20:00:00+00', '2099-07-01 21:00:00+00', 'Fixture set for full reveal level', '11111111-1111-1111-1111-111111111111', now(), now());

INSERT INTO public.set_artists (set_id, artist_id, role, created_at) VALUES
  ('c4000000-0000-0000-0000-000000000001', 'c5000000-0000-0000-0000-000000000001', 'performer', now()),
  ('c4000000-0000-0000-0000-000000000002', 'c5000000-0000-0000-0000-000000000002', 'performer', now()),
  ('c4000000-0000-0000-0000-000000000003', 'c5000000-0000-0000-0000-000000000003', 'performer', now()),
  ('c4000000-0000-0000-0000-000000000004', 'c5000000-0000-0000-0000-000000000004', 'performer', now()),
  ('c4000000-0000-0000-0000-000000000005', 'c5000000-0000-0000-0000-000000000005', 'performer', now()),
  ('c4000000-0000-0000-0000-000000000006', 'c5000000-0000-0000-0000-000000000006', 'performer', now()),
  ('c4000000-0000-0000-0000-000000000007', 'c5000000-0000-0000-0000-000000000007', 'performer', now()),
  ('c4000000-0000-0000-0000-000000000008', 'c5000000-0000-0000-0000-000000000008', 'performer', now()),
  ('c4000000-0000-0000-0000-000000000009', 'c5000000-0000-0000-0000-000000000009', 'performer', now()),
  ('c4000000-0000-0000-0000-00000000000a', 'c5000000-0000-0000-0000-00000000000a', 'performer', now()),
  ('c4000000-0000-0000-0000-00000000000b', 'c5000000-0000-0000-0000-00000000000b', 'performer', now()),
  ('c4000000-0000-0000-0000-00000000000c', 'c5000000-0000-0000-0000-00000000000c', 'performer', now()),
  ('c4000000-0000-0000-0000-00000000000d', 'c5000000-0000-0000-0000-00000000000d', 'performer', now()),
  ('c4000000-0000-0000-0000-00000000000e', 'c5000000-0000-0000-0000-00000000000e', 'performer', now()),
  ('c4000000-0000-0000-0000-00000000000f', 'c5000000-0000-0000-0000-00000000000f', 'performer', now()),
  ('c4000000-0000-0000-0000-000000000010', 'c5000000-0000-0000-0000-000000000010', 'performer', now()),
  ('c4000000-0000-0000-0000-000000000011', 'c5000000-0000-0000-0000-000000000011', 'performer', now()),
  ('c4000000-0000-0000-0000-000000000012', 'c5000000-0000-0000-0000-000000000012', 'performer', now()),
  ('c4000000-0000-0000-0000-000000000065', 'c5000000-0000-0000-0000-000000000001', 'performer', now()),
  ('c4000000-0000-0000-0000-000000000066', 'c5000000-0000-0000-0000-000000000002', 'performer', now()),
  ('c4000000-0000-0000-0000-000000000067', 'c5000000-0000-0000-0000-000000000003', 'performer', now()),
  ('c4000000-0000-0000-0000-000000000068', 'c5000000-0000-0000-0000-000000000004', 'performer', now()),
  ('c4000000-0000-0000-0000-000000000069', 'c5000000-0000-0000-0000-000000000005', 'performer', now()),
  ('c4000000-0000-0000-0000-00000000006a', 'c5000000-0000-0000-0000-000000000006', 'performer', now()),
  ('c4000000-0000-0000-0000-00000000006b', 'c5000000-0000-0000-0000-000000000007', 'performer', now()),
  ('c4000000-0000-0000-0000-00000000006c', 'c5000000-0000-0000-0000-000000000008', 'performer', now()),
  ('c4000000-0000-0000-0000-00000000006d', 'c5000000-0000-0000-0000-000000000009', 'performer', now()),
  ('c4000000-0000-0000-0000-00000000006e', 'c5000000-0000-0000-0000-00000000000a', 'performer', now()),
  ('c4000000-0000-0000-0000-00000000006f', 'c5000000-0000-0000-0000-00000000000b', 'performer', now()),
  ('c4000000-0000-0000-0000-000000000070', 'c5000000-0000-0000-0000-00000000000c', 'performer', now()),
  ('c4000000-0000-0000-0000-000000000071', 'c5000000-0000-0000-0000-00000000000d', 'performer', now()),
  ('c4000000-0000-0000-0000-000000000072', 'c5000000-0000-0000-0000-00000000000e', 'performer', now()),
  ('c4000000-0000-0000-0000-000000000073', 'c5000000-0000-0000-0000-00000000000f', 'performer', now()),
  ('c4000000-0000-0000-0000-000000000074', 'c5000000-0000-0000-0000-000000000010', 'performer', now()),
  ('c4000000-0000-0000-0000-000000000075', 'c5000000-0000-0000-0000-000000000011', 'performer', now()),
  ('c4000000-0000-0000-0000-000000000076', 'c5000000-0000-0000-0000-000000000012', 'performer', now()),
  ('c4000000-0000-0000-0000-000000000fff', 'c5000000-0000-0000-0000-000000000001', 'performer', now());

