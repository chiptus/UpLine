import { describe, expect, it } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Suspense } from "react";
import { StagePin } from "./StagePin";

// Seeded in supabase/seed.sql; also used by
// tests/e2e/schedule-filter-sheet.spec.ts as MAIN_STAGE_ID.
const MAIN_STAGE_ID = "11111111-1111-1111-1111-11111111111a";
const CLUB_STAGE_ID = "22222222-2222-2222-2222-22222222222b";

function renderStagePin(stageId: string | null) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  const utils = render(
    <QueryClientProvider client={queryClient}>
      <Suspense fallback={null}>
        <StagePin stageId={stageId} />
      </Suspense>
    </QueryClientProvider>,
  );
  return { queryClient, ...utils };
}

async function waitForSettled(queryClient: QueryClient) {
  await waitFor(() => expect(queryClient.isFetching()).toBe(0));
}

describe("StagePin", () => {
  it("renders stage name when data is available", async () => {
    const { queryClient } = renderStagePin(MAIN_STAGE_ID);
    await waitForSettled(queryClient);

    expect(screen.getByText("Main Stage")).toBeInTheDocument();
  });

  it("renders MapPin icon when data is available", async () => {
    const { queryClient, container } = renderStagePin(MAIN_STAGE_ID);
    await waitForSettled(queryClient);

    expect(container.querySelector("svg")).toBeInTheDocument();
  });

  it("renders null when stage is not found", async () => {
    const { queryClient, container } = renderStagePin(crypto.randomUUID());
    await waitForSettled(queryClient);

    expect(container.firstChild).toBeNull();
  });

  it("renders null when stageId is null", () => {
    // StagePin returns before ever calling useStageQuery, so no query
    // fires and there's nothing to wait for.
    const { container } = renderStagePin(null);
    expect(container.firstChild).toBeNull();
  });

  it("has correct container classes", async () => {
    const { queryClient, container } = renderStagePin(MAIN_STAGE_ID);
    await waitForSettled(queryClient);

    const wrapper = container.querySelector("div");
    expect(wrapper).toHaveClass("flex", "items-center", "gap-2");
  });

  it("has correct icon size", async () => {
    const { queryClient, container } = renderStagePin(MAIN_STAGE_ID);
    await waitForSettled(queryClient);

    const icon = container.querySelector("svg");
    expect(icon).toHaveClass("h-4", "w-4");
  });

  it("has correct text size", async () => {
    const { queryClient, container } = renderStagePin(MAIN_STAGE_ID);
    await waitForSettled(queryClient);

    const text = container.querySelector("span");
    expect(text).toHaveClass("text-sm");
  });

  it("renders a different stage's name", async () => {
    const { queryClient } = renderStagePin(CLUB_STAGE_ID);
    await waitForSettled(queryClient);

    expect(screen.getByText("Club Stage")).toBeInTheDocument();
    expect(screen.queryByText("Main Stage")).not.toBeInTheDocument();
  });
});
