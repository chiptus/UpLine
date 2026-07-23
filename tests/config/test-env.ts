// Test environment configuration
export const TEST_CONFIG = {
  // Base email for the passwordless test voter; each call appends a unique suffix.
  TEST_USER_EMAIL_BASE: process.env.TEST_USER_EMAIL || "e2e-voter",
  TEST_USER_EMAIL_DOMAIN: process.env.TEST_USER_EMAIL_DOMAIN || "example.com",
  // Mailpit is the local Supabase stack's email testing service.
  MAILPIT_URL: process.env.TEST_MAILPIT_URL || "http://127.0.0.1:54324",
  // Seeded via supabase/seed.sql as an already-onboarded existing user.
  SEEDED_ONBOARDED_USER_EMAIL: "test@example.com",
  // Local Supabase's fixed local-dev service role key (never a real secret).
  SUPABASE_URL: process.env.TEST_SUPABASE_URL || "http://127.0.0.1:54321",
  SUPABASE_SERVICE_ROLE_KEY:
    process.env.TEST_SUPABASE_SERVICE_ROLE_KEY ||
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU",
};
