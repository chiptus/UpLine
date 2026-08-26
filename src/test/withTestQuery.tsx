import type { ComponentType } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

export function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
}

/**
 * Wraps a component in a fresh QueryClientProvider for unit tests. Pass a
 * client to share it with the test (e.g. to spy on invalidateQueries), or
 * `Fragment` as the component to use as a renderHook `wrapper`.
 */
export function withTestQuery<P extends object>(
  Component: ComponentType<P>,
  client: QueryClient = createTestQueryClient(),
) {
  function WithTestQuery(props: P) {
    return (
      <QueryClientProvider client={client}>
        <Component {...props} />
      </QueryClientProvider>
    );
  }
  WithTestQuery.queryClient = client;
  return WithTestQuery;
}
