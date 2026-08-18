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

describe("StagePin", () => {
  it("renders stage name when data is available", async () => {
    await renderStagePin(SEEDED_MAIN_STAGE_ID);

    expect(screen.getByText("Main Stage")).toBeInTheDocument();
  });

  it("renders MapPin icon when data is available", async () => {
    const { container } = await renderStagePin(SEEDED_MAIN_STAGE_ID);

    expect(container.querySelector("svg")).toBeInTheDocument();
  });

  it("renders null when stage is not found", async () => {
    const { container } = await renderStagePin(crypto.randomUUID());

    expect(container.firstChild).toBeNull();
  });

  it("renders null when stageId is null", () => {
    // StagePin returns before ever calling useStageQuery, so no query
    // fires and there's nothing to wait for — a plain render() is enough.
    const { container } = render(<StagePin stageId={null} />);
    expect(container.firstChild).toBeNull();
  });

  it("renders a different stage's name", async () => {
    await renderStagePin(SEEDED_CLUB_STAGE_ID);

    expect(screen.getByText("Club Stage")).toBeInTheDocument();
    expect(screen.queryByText("Main Stage")).not.toBeInTheDocument();
  });
});

async function renderStagePin(stageId: string) {
  const utils = renderWithQueryClient(<StagePin stageId={stageId} />);
  await waitForQueriesSettled(utils.queryClient);
  return utils;
}
