// The user seeded by supabase/seed.sql (already onboarded, granted an admin
// role). Factories reference it read-only to satisfy FK columns like
// `added_by`/`created_by` — a fresh integration test has no reason to create
// its own auth user just to point one of those at something valid.
export const SEEDED_USER_ID = "11111111-1111-1111-1111-111111111111";

// Stages seeded by supabase/seed.sql for "Boom Festival 2025" — also
// referenced (independently, since Playwright doesn't share this module)
// as MAIN_STAGE_ID by tests/e2e/schedule-filter-sheet.spec.ts.
export const SEEDED_MAIN_STAGE_ID = "11111111-1111-1111-1111-11111111111a";
export const SEEDED_CLUB_STAGE_ID = "22222222-2222-2222-2222-22222222222b";
