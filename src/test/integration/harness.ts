import { afterEach } from "vitest";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

// Supabase CLI's fixed local-dev credentials (never a real secret) — the
// same defaults tests/config/test-env.ts uses for the Playwright suite.
const SUPABASE_URL = process.env.TEST_SUPABASE_URL ?? "http://127.0.0.1:54321";
const SUPABASE_SERVICE_ROLE_KEY =
  process.env.TEST_SUPABASE_SERVICE_ROLE_KEY ??
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU";

// Service-role client for test setup/teardown only — it bypasses RLS.
// Code under test always goes through the app's own anon-key client
// (`@/integrations/supabase/client`), which the integration setup file
// points at this same local instance.
export const testSupabase = createClient<Database>(
  SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY,
);

type Cleanup = () => Promise<void> | void;

const cleanups: Cleanup[] = [];

// Later tickets' fixture factories register their teardown here so every
// row they create self-cleans; until then, tests can register ad-hoc
// cleanup directly.
export function registerCleanup(cleanup: Cleanup): void {
  cleanups.push(cleanup);
}

afterEach(async () => {
  while (cleanups.length > 0) {
    const cleanup = cleanups.pop();
    await cleanup?.();
  }
});
