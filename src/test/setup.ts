import "@testing-library/jest-dom/vitest";
import { vi } from "vitest";

// Pin the timezone so date formatting is deterministic regardless of the
// machine's local zone. Tests that assert "UTC calendar day" fallbacks only
// hold when the process runs in UTC (as CI does); Node re-reads TZ on the next
// Date operation, so setting it here covers every worker.
process.env.TZ = "UTC";

// Stub the Supabase env vars so the client module can initialise even when
// VITE_SUPABASE_URL / VITE_SUPABASE_PUBLISHABLE_KEY aren't set in the test
// environment. Tests that exercise data fetching mock the relevant query
// hooks; the client itself never actually issues a request.
vi.stubEnv("VITE_SUPABASE_URL", "http://localhost:54321");
vi.stubEnv("VITE_SUPABASE_PUBLISHABLE_KEY", "test-anon-key");

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
