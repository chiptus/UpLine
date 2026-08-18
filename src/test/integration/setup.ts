import "@testing-library/jest-dom/vitest";
import { vi } from "vitest";
import "../webidlPolyfills";
import { TEST_CONFIG } from "../../../tests/config/test-env";

// Pin the timezone so date formatting is deterministic regardless of the
// machine's local zone.
process.env.TZ = "UTC";

// Point the app's real Supabase client at a manually-started local instance
// instead of the fake values the unit-test tier stubs — integration tests
// issue real requests and assert on real responses.
vi.stubEnv("VITE_SUPABASE_URL", TEST_CONFIG.SUPABASE_URL);
vi.stubEnv(
  "VITE_SUPABASE_PUBLISHABLE_KEY",
  process.env.TEST_SUPABASE_ANON_KEY ??
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0",
);
