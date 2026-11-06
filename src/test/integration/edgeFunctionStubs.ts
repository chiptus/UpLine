import { afterAll, afterEach, beforeAll } from "vitest";
import { setupServer } from "msw/node";
import type { RequestHandler } from "msw";

/**
 * Stubs Edge Function responses at the network boundary for the duration of
 * a test file. The integration stack doesn't serve Edge Functions (they call
 * third-party APIs), so the real hooks run against a fake transport. Any
 * request without a handler passes through to the local Supabase.
 */
export function stubEdgeFunctions(...handlers: RequestHandler[]): void {
  const server = setupServer(...handlers);

  beforeAll(() => server.listen({ onUnhandledFrame: "bypass" }));
  afterEach(() => server.resetHandlers(...handlers));
  afterAll(() => server.close());
}
