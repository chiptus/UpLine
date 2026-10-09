import {
  Outlet,
  RouterProvider,
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
} from "@tanstack/react-router";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Route as ArtistsLayoutRoute } from "../artists";

describe("admin artists layout", () => {
  it("renders the child route inside the layout", async () => {
    renderAt("/artists/duplicates");

    expect(await screen.findByText("duplicates page")).toBeInTheDocument();
    expect(screen.queryByText("artists list")).not.toBeInTheDocument();
  });

  it("renders the index child at the layout root", async () => {
    renderAt("/artists");

    expect(await screen.findByText("artists list")).toBeInTheDocument();
  });
});

function renderAt(path: string) {
  const rootRoute = createRootRoute({ component: Outlet });
  const layout = createRoute({
    getParentRoute: () => rootRoute,
    path: "/artists",
    component: ArtistsLayoutRoute.options.component ?? Outlet,
  });
  const index = createRoute({
    getParentRoute: () => layout,
    path: "/",
    component: () => <div>artists list</div>,
  });
  const duplicates = createRoute({
    getParentRoute: () => layout,
    path: "/duplicates",
    component: () => <div>duplicates page</div>,
  });
  const router = createRouter({
    routeTree: rootRoute.addChildren([layout.addChildren([index, duplicates])]),
    history: createMemoryHistory({ initialEntries: [path] }),
  });

  return render(<RouterProvider router={router} />);
}
