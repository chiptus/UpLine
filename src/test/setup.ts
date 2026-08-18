import "@testing-library/jest-dom/vitest";
import { vi } from "vitest";
import "./webidlPolyfills";

// Pin the timezone so date formatting is deterministic regardless of the
// machine's local zone. Tests that assert "UTC calendar day" fallbacks only
// hold when the process runs in UTC (as CI does); Node re-reads TZ on the next
// Date operation, so setting it here covers every worker.
process.env.TZ = "UTC";

// Stub the Supabase env vars so the client module can initialise even when
// VITE_SUPABASE_URL / VITE_SUPABASE_PUBLISHABLE_KEY aren't set in the test
// environment. This is the unit-test tier: tests that exercise data
// fetching mock the relevant query hooks, so the client itself never
// actually issues a request. Tests that need real Supabase data belong in
// the integration tier instead (`*.integration.test.ts`, run via
// `pnpm test:integration`), which wires up a real client — see
// `src/test/integration/`.
vi.stubEnv("VITE_SUPABASE_URL", "http://localhost:54321");
vi.stubEnv("VITE_SUPABASE_PUBLISHABLE_KEY", "test-anon-key");
