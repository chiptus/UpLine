import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react-swc";
import path from "path";

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: "jsdom",
    globalSetup: "./vitest.global-setup.ts",
    setupFiles: ["./src/test/integration/setup.ts"],
    include: ["src/**/*.integration.test.ts", "src/**/*.integration.test.tsx"],
    pool: "forks",
    // Tests share one local Supabase instance and some mutate shared tables
    // (see useGenres.integration.test.ts's empty-result case), so run test
    // files serially to avoid cross-test races.
    fileParallelism: false,
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
