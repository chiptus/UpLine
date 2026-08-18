import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { StagePin } from "./StagePin";
import {
  renderWithQueryClient,
  waitForQueriesSettled,
} from "@/test/integration/harness";
import {
  SEEDED_CLUB_STAGE_ID,
  SEEDED_MAIN_STAGE_ID,
} from "@/test/integration/fixtures/constants";

function renderStagePin(stageId: string | null) {
  return renderWithQueryClient(<StagePin stageId={stageId} />);
}

describe("StagePin", () => {
  it("renders stage name when data is available", async () => {
    const { queryClient } = renderStagePin(SEEDED_MAIN_STAGE_ID);
    await waitForQueriesSettled(queryClient);

    expect(screen.getByText("Main Stage")).toBeInTheDocument();
  });

  it("renders MapPin icon when data is available", async () => {
    const { queryClient, container } = renderStagePin(SEEDED_MAIN_STAGE_ID);
    await waitForQueriesSettled(queryClient);

    expect(container.querySelector("svg")).toBeInTheDocument();
  });

  it("renders null when stage is not found", async () => {
    const { queryClient, container } = renderStagePin(crypto.randomUUID());
    await waitForQueriesSettled(queryClient);

    expect(container.firstChild).toBeNull();
  });

  it("renders null when stageId is null", () => {
    // StagePin returns before ever calling useStageQuery, so no query
    // fires and there's nothing to wait for — a plain render() is enough.
    const { container } = render(<StagePin stageId={null} />);
    expect(container.firstChild).toBeNull();
  });

  it("has correct container classes", async () => {
    const { queryClient, container } = renderStagePin(SEEDED_MAIN_STAGE_ID);
    await waitForQueriesSettled(queryClient);

    const wrapper = container.querySelector("div");
    expect(wrapper).toHaveClass("flex", "items-center", "gap-2");
  });

  it("has correct icon size", async () => {
    const { queryClient, container } = renderStagePin(SEEDED_MAIN_STAGE_ID);
    await waitForQueriesSettled(queryClient);

    const icon = container.querySelector("svg");
    expect(icon).toHaveClass("h-4", "w-4");
  });

  it("has correct text size", async () => {
    const { queryClient, container } = renderStagePin(SEEDED_MAIN_STAGE_ID);
    await waitForQueriesSettled(queryClient);

    const text = container.querySelector("span");
    expect(text).toHaveClass("text-sm");
  });

  it("renders a different stage's name", async () => {
    const { queryClient } = renderStagePin(SEEDED_CLUB_STAGE_ID);
    await waitForQueriesSettled(queryClient);

    expect(screen.getByText("Club Stage")).toBeInTheDocument();
    expect(screen.queryByText("Main Stage")).not.toBeInTheDocument();
  });
});
