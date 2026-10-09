import { createMemoryHistory, createRouter } from "@tanstack/react-router";
import { describe, expect, it, vi } from "vitest";
import { routeTree } from "@/routeTree.gen";

vi.mock("@/components/layout/AppUpdatePrompt", () => ({
  AppUpdatePrompt: () => null,
}));

describe("admin artists routes", () => {
  it("renders the duplicates page inside the artists layout, not the list", () => {
    const routeIds = matchedRouteIds("/admin/artists/duplicates");

    expect(routeIds).toContain("/admin/artists/duplicates");
    expect(routeIds).not.toContain("/admin/artists/");
  });

  it("renders the artists list at /admin/artists", () => {
    const routeIds = matchedRouteIds("/admin/artists");

    expect(routeIds).toContain("/admin/artists/");
    expect(routeIds).not.toContain("/admin/artists/duplicates");
  });

  it("makes the artists route a layout that can host the duplicates child", () => {
    const router = buildRouter("/admin/artists/duplicates");
    const layout = router.routesById["/admin/artists"];

    expect(layout.children).toContain(
      router.routesById["/admin/artists/duplicates"],
    );
    expect(layout.options.component).toBeDefined();
  });
});

function buildRouter(path: string) {
  return createRouter({
    routeTree,
    history: createMemoryHistory({ initialEntries: [path] }),
    context: { queryClient: undefined as never, user: null },
  });
}

function matchedRouteIds(path: string): string[] {
  return buildRouter(path)
    .matchRoutes(path)
    .map((match) => match.routeId);
}
