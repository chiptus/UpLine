import { createElement, Suspense, type ReactNode } from "react";
import { afterEach } from "vitest";
import { createClient } from "@supabase/supabase-js";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { Database } from "@/integrations/supabase/types";
import { TEST_CONFIG } from "../../../tests/config/test-env";

// Service-role client for test setup/teardown only — it bypasses RLS.
// Code under test always goes through the app's own anon-key client
// (`@/integrations/supabase/client`), which the integration setup file
// points at this same local instance. Auth session features are disabled
// since this client never signs in — leaving them on would spin up
// unnecessary token-refresh timers.
export const testSupabase = createClient<Database>(
  TEST_CONFIG.SUPABASE_URL,
  TEST_CONFIG.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false, autoRefreshToken: false } },
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
  const errors: unknown[] = [];
  while (cleanups.length > 0) {
    const cleanup = cleanups.pop();
    try {
      await cleanup?.();
    } catch (error) {
      errors.push(error);
    }
  }
  if (errors.length > 0) {
    throw errors.length === 1
      ? errors[0]
      : new AggregateError(errors, "Integration test cleanup failed");
  }
});

// Shared QueryClient + Suspense wrapper for `renderHook` in integration
// tests that exercise a Suspense query hook against real Supabase data.
export function createQueryWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  return function Wrapper({ children }: { children: ReactNode }) {
    return createElement(
      QueryClientProvider,
      { client: queryClient },
      createElement(Suspense, { fallback: null }, children),
    );
  };
}
