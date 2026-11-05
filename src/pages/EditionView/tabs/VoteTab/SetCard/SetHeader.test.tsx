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
import type { FestivalSet } from "@/api/sets/types";
import { FestivalSetProvider } from "../FestivalSetContext";
import { SetHeader } from "./SetHeader";

describe("SetHeader", () => {
  it("links the set name to the set details page", async () => {
    await renderHeader(makeSet({ slug: "headliner" }));

    const link = await screen.findByRole("link", { name: "Headliner" });
    expect(link).toHaveAttribute(
      "href",
      "/festivals/fest/editions/2026/sets/headliner",
    );
  });

  it("renders plain text when the set has no slug", async () => {
    await renderHeader(makeSet({ slug: "" }));

    expect(await screen.findByText("Headliner")).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Headliner" })).toBeNull();
  });
});

async function renderHeader(set: FestivalSet) {
  const rootRoute = createRootRoute({ component: Outlet });
  const edition = createRoute({
    getParentRoute: () => rootRoute,
    path: "/festivals/$festivalSlug/editions/$editionSlug",
    component: () => (
      <FestivalSetProvider set={set} onLockSort={() => {}}>
        <SetHeader />
      </FestivalSetProvider>
    ),
  });
  const setDetails = createRoute({
    getParentRoute: () => edition,
    path: "/sets/$setSlug",
    component: () => null,
  });
  const router = createRouter({
    routeTree: rootRoute.addChildren([edition.addChildren([setDetails])]),
    history: createMemoryHistory({
      initialEntries: ["/festivals/fest/editions/2026"],
    }),
  });

  render(<RouterProvider router={router} />);
}

function makeSet(overrides: Partial<FestivalSet>): FestivalSet {
  return {
    name: "Headliner",
    set_type: "performance",
    artists: [],
    votes: [],
    ...overrides,
  } as FestivalSet;
}
