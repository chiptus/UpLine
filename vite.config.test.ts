// Polyfill ArrayBuffer and SharedArrayBuffer properties before any imports
// This prevents webidl-conversions errors in Node 18 CI environment
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

import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react-swc";
import path from "path";

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: "jsdom",
    globalSetup: "./vitest.global-setup.ts",
    setupFiles: ["./src/test/setup.ts"],
    pool: "forks",
    exclude: [
      "**/node_modules/**",
      "**/dist/**",
      "**/cypress/**",
      "**/.{idea,git,cache,output,temp}/**",
      "**/{karma,rollup,webpack,vite,vitest,jest,ava,babel,nyc,cypress,tsup,build,eslint,prettier}.config.*",
      "**/tests/e2e/**", // Exclude Playwright E2E tests
    ],
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
