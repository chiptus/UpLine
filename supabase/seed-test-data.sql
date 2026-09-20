-- Synthetic [TEST] festivals for local dev and staging QA (UPL-71).
--
-- Unlike the rest of seed.sql (which mirrors realistic prod-like data),
-- everything in this file is clearly synthetic: festival names are prefixed
-- "[TEST] " and slugs are prefixed "test-" so they're unmistakable in any
-- environment they land in, including staging. All ids use the fixed
-- `d9......` UUID prefix range, distinct from every range already used
-- elsewhere in seed.sql, so this file is easy to grep and audit on its own.
--
-- Included from supabase/seed.sql (`\ir seed-test-data.sql`) so `supabase db
-- reset` seeds local dev with it automatically, and applied a second way by
-- scripts/sync-from-prod.sh (`psql -f supabase/seed-test-data.sql`) as the
-- final step of syncing prod data into staging, since staging is otherwise
-- only ever seeded by that prod copy and never has these edge cases.
--
-- Idempotency: every statement below uses a fixed id/slug plus
-- ON CONFLICT DO NOTHING/DO UPDATE, so this file is safe to run repeatedly
-- (e.g. once per sync-from-prod.sh run) without duplicating rows.

-- Three extra synthetic auth users (beyond seed.sql's existing
-- test@example.com / 11111111-...) so group membership and collaborative
-- notes can be exercised with more than one account. Same GoTrue-required
-- auth.users + auth.identities pattern as the first seeded user.
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
) VALUES
  ('d9000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000000', 'authenticated', 'test2@example.com', '$2a$10$example_hash', now(), now(), now(), '{"username": "testuser2"}', false, 'authenticated', '', '', '', ''),
  ('d9000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000000', 'authenticated', 'test3@example.com', '$2a$10$example_hash', now(), now(), now(), '{"username": "testuser3"}', false, 'authenticated', '', '', '', ''),
  ('d9000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000000', 'authenticated', 'test4@example.com', '$2a$10$example_hash', now(), now(), now(), '{"username": "testuser4"}', false, 'authenticated', '', '', '', '')
ON CONFLICT (id) DO NOTHING;

UPDATE public.profiles
SET completed_onboarding = true
WHERE id IN (
  'd9000000-0000-0000-0000-000000000002',
  'd9000000-0000-0000-0000-000000000003',
  'd9000000-0000-0000-0000-000000000004'
);

-- GoTrue's OTP sign-in requires a matching auth.identities row for existing users.
INSERT INTO auth.identities (
  id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at
) VALUES
  ('d9000000-0000-0000-0000-000000000002', 'd9000000-0000-0000-0000-000000000002', 'd9000000-0000-0000-0000-000000000002', jsonb_build_object('sub', 'd9000000-0000-0000-0000-000000000002', 'email', 'test2@example.com'), 'email', now(), now(), now()),
  ('d9000000-0000-0000-0000-000000000003', 'd9000000-0000-0000-0000-000000000003', 'd9000000-0000-0000-0000-000000000003', jsonb_build_object('sub', 'd9000000-0000-0000-0000-000000000003', 'email', 'test3@example.com'), 'email', now(), now(), now()),
  ('d9000000-0000-0000-0000-000000000004', 'd9000000-0000-0000-0000-000000000004', 'd9000000-0000-0000-0000-000000000004', jsonb_build_object('sub', 'd9000000-0000-0000-0000-000000000004', 'email', 'test4@example.com'), 'email', now(), now(), now())
ON CONFLICT (id) DO NOTHING;

-- 1. Multi-edition festival: Post-Festival (past), Live (active), and
--    Pre-Schedule/Planning (future, unrevealed) editions on the same festival,
--    so a single festival exercises all four derived phases across its editions.
INSERT INTO public.festivals (id, name, slug, description, published, created_at, updated_at) VALUES
  ('d9100000-0000-0000-0000-000000000001', '[TEST] Multi-Phase Festival', 'test-multi-phase', 'Synthetic festival covering Post-Festival, Live and Pre-Schedule editions for QA.', true, now(), now())
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  slug = EXCLUDED.slug,
  description = EXCLUDED.description,
  published = EXCLUDED.published,
  updated_at = now();

INSERT INTO public.festival_editions (id, festival_id, year, slug, name, description, location, start_date, end_date, published, schedule_reveal_level, phase_override, created_at, updated_at) VALUES
  ('d9200000-0000-0000-0000-000000000001', 'd9100000-0000-0000-0000-000000000001', 2024, '2024', '[TEST] Multi-Phase Festival 2024', 'Past edition, pinned to Post-Festival for retrospective rating QA.', 'Testland', '2024-07-12', '2024-07-14', true, 'full', 'post-festival', now(), now()),
  ('d9200000-0000-0000-0000-000000000002', 'd9100000-0000-0000-0000-000000000001', 2025, '2025', '[TEST] Multi-Phase Festival 2025', 'Active edition, pinned to Live for voting QA.', 'Testland', '2025-07-12', '2025-07-14', true, 'full', 'live', now(), now()),
  ('d9200000-0000-0000-0000-000000000003', 'd9100000-0000-0000-0000-000000000001', 2027, '2027', '[TEST] Multi-Phase Festival 2027', 'Future edition with an unrevealed schedule, for Pre-Schedule/Planning QA.', 'Testland', NULL, NULL, true, 'draft', NULL, now(), now())
ON CONFLICT (id) DO UPDATE SET
  festival_id = EXCLUDED.festival_id,
  year = EXCLUDED.year,
  slug = EXCLUDED.slug,
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  location = EXCLUDED.location,
  start_date = EXCLUDED.start_date,
  end_date = EXCLUDED.end_date,
  published = EXCLUDED.published,
  schedule_reveal_level = EXCLUDED.schedule_reveal_level,
  phase_override = EXCLUDED.phase_override,
  updated_at = now();

-- Stages + artists + sets live on the Live edition only (and reused on the
-- Post-Festival edition for its own stage) - the Pre-Schedule edition stays
-- empty on purpose, since its schedule hasn't been revealed yet.
INSERT INTO public.stages (id, name, slug, festival_edition_id, created_at, updated_at) VALUES
  ('d9300000-0000-0000-0000-000000000001', 'Test Main Stage', 'test-main-stage', 'd9200000-0000-0000-0000-000000000002', now(), now()),
  ('d9300000-0000-0000-0000-000000000002', 'Test Second Stage', 'test-second-stage', 'd9200000-0000-0000-0000-000000000002', now(), now()),
  ('d9300000-0000-0000-0000-000000000003', 'Test Main Stage', 'test-main-stage', 'd9200000-0000-0000-0000-000000000001', now(), now())
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  slug = EXCLUDED.slug,
  festival_edition_id = EXCLUDED.festival_edition_id,
  updated_at = now();

INSERT INTO public.artists (id, name, description, added_by, created_at, updated_at, slug) VALUES
  ('d9400000-0000-0000-0000-000000000001', 'Test Artist One', 'Synthetic artist for UPL-71 QA fixtures.', '11111111-1111-1111-1111-111111111111', now(), now(), 'test-artist-one'),
  ('d9400000-0000-0000-0000-000000000002', 'Test Artist Two', 'Synthetic artist for UPL-71 QA fixtures.', '11111111-1111-1111-1111-111111111111', now(), now(), 'test-artist-two'),
  ('d9400000-0000-0000-0000-000000000003', 'Test Artist Three', 'Synthetic artist for UPL-71 QA fixtures.', '11111111-1111-1111-1111-111111111111', now(), now(), 'test-artist-three'),
  ('d9400000-0000-0000-0000-000000000004', 'Test Artist Four', 'Synthetic artist for UPL-71 QA fixtures.', '11111111-1111-1111-1111-111111111111', now(), now(), 'test-artist-four')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  updated_at = now();

INSERT INTO public.sets (id, name, slug, festival_edition_id, stage_id, time_start, time_end, description, created_by, created_at, updated_at) VALUES
  ('d9500000-0000-0000-0000-000000000001', 'Test Artist One', 'test-artist-one-set', 'd9200000-0000-0000-0000-000000000002', 'd9300000-0000-0000-0000-000000000001', '2025-07-12 20:00:00+00', '2025-07-12 21:30:00+00', 'Synthetic set for UPL-71 QA fixtures.', '11111111-1111-1111-1111-111111111111', now(), now()),
  ('d9500000-0000-0000-0000-000000000002', 'Test Artist Two', 'test-artist-two-set', 'd9200000-0000-0000-0000-000000000002', 'd9300000-0000-0000-0000-000000000002', '2025-07-13 21:00:00+00', '2025-07-13 22:30:00+00', 'Synthetic set for UPL-71 QA fixtures.', '11111111-1111-1111-1111-111111111111', now(), now()),
  ('d9500000-0000-0000-0000-000000000003', 'Test Artist Three', 'test-artist-three-set', 'd9200000-0000-0000-0000-000000000001', 'd9300000-0000-0000-0000-000000000003', '2024-07-12 20:00:00+00', '2024-07-12 21:30:00+00', 'Synthetic set for UPL-71 QA fixtures.', '11111111-1111-1111-1111-111111111111', now(), now()),
  ('d9500000-0000-0000-0000-000000000004', 'Test Artist Four', 'test-artist-four-set', 'd9200000-0000-0000-0000-000000000002', 'd9300000-0000-0000-0000-000000000001', '2025-07-14 18:00:00+00', '2025-07-14 19:30:00+00', 'Synthetic set for UPL-71 QA fixtures.', '11111111-1111-1111-1111-111111111111', now(), now())
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  slug = EXCLUDED.slug,
  festival_edition_id = EXCLUDED.festival_edition_id,
  stage_id = EXCLUDED.stage_id,
  time_start = EXCLUDED.time_start,
  time_end = EXCLUDED.time_end,
  description = EXCLUDED.description,
  updated_at = now();

INSERT INTO public.set_artists (set_id, artist_id, role, created_at) VALUES
  ('d9500000-0000-0000-0000-000000000001', 'd9400000-0000-0000-0000-000000000001', 'performer', now()),
  ('d9500000-0000-0000-0000-000000000002', 'd9400000-0000-0000-0000-000000000002', 'performer', now()),
  ('d9500000-0000-0000-0000-000000000003', 'd9400000-0000-0000-0000-000000000003', 'performer', now()),
  ('d9500000-0000-0000-0000-000000000004', 'd9400000-0000-0000-0000-000000000004', 'performer', now())
ON CONFLICT (set_id, artist_id) DO NOTHING;

-- Test group for collaborative voting/notes QA, with the four synthetic
-- users (the shared 11111111 test user, plus the three added above) as members.
INSERT INTO public.groups (id, name, slug, description, created_by, created_at, updated_at) VALUES
  ('d9600000-0000-0000-0000-000000000001', '[TEST] QA Group', 'test-qa-group', 'Synthetic group for UPL-71 QA fixtures.', '11111111-1111-1111-1111-111111111111', now(), now())
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  slug = EXCLUDED.slug,
  description = EXCLUDED.description,
  updated_at = now();

INSERT INTO public.group_members (group_id, user_id, role, joined_at) VALUES
  ('d9600000-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 'owner', now()),
  ('d9600000-0000-0000-0000-000000000001', 'd9000000-0000-0000-0000-000000000002', 'member', now()),
  ('d9600000-0000-0000-0000-000000000001', 'd9000000-0000-0000-0000-000000000003', 'member', now()),
  ('d9600000-0000-0000-0000-000000000001', 'd9000000-0000-0000-0000-000000000004', 'member', now())
ON CONFLICT (group_id, user_id) DO NOTHING;

-- A few sample votes across the Live edition's sets, from different members.
INSERT INTO public.votes (user_id, set_id, vote_type, created_at, updated_at) VALUES
  ('11111111-1111-1111-1111-111111111111', 'd9500000-0000-0000-0000-000000000001', 2, now(), now()),
  ('d9000000-0000-0000-0000-000000000002', 'd9500000-0000-0000-0000-000000000001', 1, now(), now()),
  ('d9000000-0000-0000-0000-000000000003', 'd9500000-0000-0000-0000-000000000002', 2, now(), now()),
  ('d9000000-0000-0000-0000-000000000004', 'd9500000-0000-0000-0000-000000000004', -1, now(), now())
ON CONFLICT (user_id, set_id) DO UPDATE SET
  vote_type = EXCLUDED.vote_type,
  updated_at = now();

-- Sample collaborative notes on the seeded test artists. artist_notes has no
-- unique constraint on (artist_id, user_id) (dropped in
-- 20250621125212_create_functions.sql to allow multiple notes per user), so
-- idempotency here is keyed on a fixed `id` instead.
INSERT INTO public.artist_notes (id, user_id, artist_id, note_content, created_at) VALUES
  ('d9700000-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 'd9400000-0000-0000-0000-000000000001', 'Synthetic note for UPL-71 QA fixtures.', now()),
  ('d9700000-0000-0000-0000-000000000002', 'd9000000-0000-0000-0000-000000000002', 'd9400000-0000-0000-0000-000000000001', 'Another synthetic note, from a second account.', now())
ON CONFLICT (id) DO UPDATE SET
  note_content = EXCLUDED.note_content,
  updated_at = now();

-- 2. Zero-edition festival: exists, but has no festival_editions rows at all
--    (edge case for "empty editions" list/detail-page handling).
INSERT INTO public.festivals (id, name, slug, description, published, created_at, updated_at) VALUES
  ('d9100000-0000-0000-0000-000000000002', '[TEST] Empty Festival', 'test-empty', 'Synthetic festival with zero editions, for empty-state QA.', true, now(), now())
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  slug = EXCLUDED.slug,
  description = EXCLUDED.description,
  published = EXCLUDED.published,
  updated_at = now();

-- 3. Single-edition festival: exactly one edition, no sets (a minimal but
--    non-empty festival, distinct from both the multi-edition and
--    zero-edition cases above).
INSERT INTO public.festivals (id, name, slug, description, published, created_at, updated_at) VALUES
  ('d9100000-0000-0000-0000-000000000003', '[TEST] Single Edition Festival', 'test-single-edition', 'Synthetic festival with exactly one edition, for minimal-festival QA.', true, now(), now())
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  slug = EXCLUDED.slug,
  description = EXCLUDED.description,
  published = EXCLUDED.published,
  updated_at = now();

INSERT INTO public.festival_editions (id, festival_id, year, slug, name, description, location, start_date, end_date, published, schedule_reveal_level, phase_override, created_at, updated_at) VALUES
  ('d9200000-0000-0000-0000-000000000004', 'd9100000-0000-0000-0000-000000000003', 2025, '2025', '[TEST] Single Edition Festival 2025', 'The only edition of this synthetic festival.', 'Testland', '2025-08-01', '2025-08-02', true, 'full', 'live', now(), now())
ON CONFLICT (id) DO UPDATE SET
  festival_id = EXCLUDED.festival_id,
  year = EXCLUDED.year,
  slug = EXCLUDED.slug,
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  location = EXCLUDED.location,
  start_date = EXCLUDED.start_date,
  end_date = EXCLUDED.end_date,
  published = EXCLUDED.published,
  schedule_reveal_level = EXCLUDED.schedule_reveal_level,
  phase_override = EXCLUDED.phase_override,
  updated_at = now();
