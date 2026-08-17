import { afterEach } from "vitest";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import { TEST_CONFIG } from "../../../tests/config/test-env";

// Service-role client for test setup/teardown only — it bypasses RLS.
// Code under test always goes through the app's own anon-key client
// (`@/integrations/supabase/client`), which the integration setup file
// points at this same local instance.
export const testSupabase = createClient<Database>(
  TEST_CONFIG.SUPABASE_URL,
  TEST_CONFIG.SUPABASE_SERVICE_ROLE_KEY,
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
