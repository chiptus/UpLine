import "@testing-library/jest-dom/vitest";
import { vi } from "vitest";

// Pin the timezone so date formatting is deterministic regardless of the
// machine's local zone.
process.env.TZ = "UTC";

// Point the app's real Supabase client at a manually-started local instance
// instead of the fake values the unit-test tier stubs — integration tests
// issue real requests and assert on real responses.
vi.stubEnv(
  "VITE_SUPABASE_URL",
  process.env.TEST_SUPABASE_URL ?? "http://127.0.0.1:54321",
);
vi.stubEnv(
  "VITE_SUPABASE_PUBLISHABLE_KEY",
  process.env.TEST_SUPABASE_ANON_KEY ??
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0",
);

// Polyfill for ArrayBuffer.prototype.resizable and SharedArrayBuffer.prototype.growable
// These are needed by webidl-conversions package
if (
  typeof ArrayBuffer !== "undefined" &&
  !Object.getOwnPropertyDescriptor(ArrayBuffer.prototype, "resizable")
) {
  Object.defineProperty(ArrayBuffer.prototype, "resizable", {
    get() {
      return false;
    },
    configurable: true,
  });
}

if (
  typeof SharedArrayBuffer !== "undefined" &&
  !Object.getOwnPropertyDescriptor(SharedArrayBuffer.prototype, "growable")
) {
  Object.defineProperty(SharedArrayBuffer.prototype, "growable", {
    get() {
      return false;
    },
    configurable: true,
  });
}

// Polyfill for webidl-conversions and whatwg-url
if (typeof global.Set === "undefined") {
  global.Set = Set;
}
if (typeof global.Map === "undefined") {
  global.Map = Map;
}
if (typeof global.WeakMap === "undefined") {
  global.WeakMap = WeakMap;
}
if (typeof global.WeakSet === "undefined") {
  global.WeakSet = WeakSet;
}
