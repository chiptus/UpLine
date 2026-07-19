import { createRoot } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { PostHogProvider } from "posthog-js/react";
import { RouterProvider, createRouter } from "@tanstack/react-router";
import { supabase } from "./integrations/supabase/client";
import { routeTree } from "./routeTree.gen";
import NotFound from "./pages/NotFound";
import { RouteLoadingFallback } from "./components/layout/RouteLoadingFallback";
import { RouteErrorFallback } from "./components/layout/RouteErrorFallback";
import "./index.css";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5_000,
      refetchOnWindowFocus: import.meta.env.PROD,
    },
    mutations: {
      retry: 1,
    },
  },
});

const router = createRouter({
  routeTree,
  context: {
    queryClient,
    user: null,
  },
  defaultPreload: "intent",
  defaultPreloadStaleTime: 0,
  defaultNotFoundComponent: NotFound,
  defaultPendingComponent: RouteLoadingFallback,
  defaultErrorComponent: RouteErrorFallback,
  rewrite: {
    input: ({ url }) => {
      if (!url.hostname.includes("getupline.com")) return url;

      const parts = url.hostname.split(".");
      if (parts.length === 2) return url;

      const [subdomain] = parts;
      if (subdomain === "www") return url;

      url.pathname = `/festivals/${subdomain}${url.pathname}`;
      return url;
    },
    output: ({ url }) => {
      if (!url.hostname.includes("getupline.com")) return url;

      if (url.pathname.startsWith("/festivals")) {
        const [, , festivalSlug] = url.pathname.split("/");
        url.hostname = `${festivalSlug}.getupline.com`;
        url.pathname = url.pathname.replace(`/festivals/${festivalSlug}`, "");
      }
      return url;
    },
  },
});

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

supabase.auth.onAuthStateChange(() => {
  router.invalidate();
});

createRoot(document.getElementById("root")!).render(
  <PostHogProvider
    apiKey={import.meta.env.VITE_PUBLIC_POSTHOG_KEY}
    options={{
      api_host: import.meta.env.VITE_PUBLIC_POSTHOG_HOST,
      defaults: "2025-05-24",
      capture_exceptions: true,
      debug: import.meta.env.MODE === "development",
    }}
  >
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  </PostHogProvider>,
);
