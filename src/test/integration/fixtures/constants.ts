// The user seeded by supabase/seed.sql (already onboarded, granted an admin
// role). Factories reference it read-only to satisfy FK columns like
// `added_by`/`created_by` — a fresh integration test has no reason to create
// its own auth user just to point one of those at something valid.
export const SEEDED_USER_ID = "11111111-1111-1111-1111-111111111111";
