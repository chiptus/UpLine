// Test environment configuration
export const TEST_CONFIG = {
  // Base email for the passwordless test voter. Each signIn() call appends a
  // per-worker suffix so parallel workers never race over the same OTP inbox.
  TEST_USER_EMAIL_BASE: process.env.TEST_USER_EMAIL || "e2e-voter",
  TEST_USER_EMAIL_DOMAIN: process.env.TEST_USER_EMAIL_DOMAIN || "example.com",
  // Mailpit is the local Supabase stack's email testing service. Its REST
  // API is used to read the OTP delivered to the test voter's inbox.
  MAILPIT_URL: process.env.TEST_MAILPIT_URL || "http://127.0.0.1:54324",
};
