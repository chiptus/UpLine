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
      "supabase/**", // Exclude Deno-only Edge Function tests
      "**/*.integration.test.ts", // Exclude the integration-test tier (see vitest.integration.config.ts)
      "**/*.integration.test.tsx",
    ],
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
