import {
  createElement,
  Suspense,
  type ReactElement,
  type ReactNode,
} from "react";
import { afterEach, expect } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
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

/** Shared QueryClient + Suspense wrapper for `renderHook` in integration tests. */
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

/**
 * Component-level equivalent of `createQueryWrapper`: renders `ui` through
 * its own QueryClient + Suspense boundary and also returns that client, so
 * callers can wait on it directly (see `waitForQueriesSettled`) — needed to
 * distinguish "still loading" from "loaded but rendered nothing" for
 * components whose success state can itself be empty output.
 */
export function renderWithQueryClient(ui: ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  const utils = render(
    createElement(
      QueryClientProvider,
      { client: queryClient },
      createElement(Suspense, { fallback: null }, ui),
    ),
  );

  return { queryClient, ...utils };
}

/** Waits for every in-flight query on `queryClient` to settle (success or error). */
export async function waitForQueriesSettled(
  queryClient: QueryClient,
): Promise<void> {
  await waitFor(() => expect(queryClient.isFetching()).toBe(0));
}

/**
 * Sets a labeled field's value by pasting instead of typing. Some fields
 * (e.g. a slug input that sanitizes its value on every keystroke, stripping
 * trailing hyphens) corrupt a hyphen-heavy value like a UUID when it's typed
 * character-by-character, since each intermediate keystroke gets sanitized
 * too. Pasting sets the whole value in one shot, avoiding that.
 */
export async function pasteIntoField(
  label: string,
  value: string,
): Promise<void> {
  const field = screen.getByLabelText(label);
  await userEvent.clear(field);
  await userEvent.paste(value);
}
