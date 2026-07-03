import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { StagePin } from "./StagePin";
import * as useStageQueryModule from "@/api/stages/useStageQuery";

type StageQueryResult = ReturnType<typeof useStageQueryModule.useStageQuery>;

vi.mock("@/api/stages/useStageQuery");

describe("StagePin", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders stage name when data is available", () => {
    vi.spyOn(useStageQueryModule, "useStageQuery").mockReturnValue({
      data: { id: "1", name: "Main Stage", color: "#ff0000", archived: false },
      isLoading: false,
      error: null,
    } as StageQueryResult);

    render(<StagePin stageId="1" />);
    expect(screen.getByText("Main Stage")).toBeInTheDocument();
  });

  it("renders MapPin icon when data is available", () => {
    vi.spyOn(useStageQueryModule, "useStageQuery").mockReturnValue({
      data: { id: "1", name: "Main Stage", color: "#ff0000", archived: false },
      isLoading: false,
      error: null,
    } as StageQueryResult);

    const { container } = render(<StagePin stageId="1" />);
    const icon = container.querySelector("svg");
    expect(icon).toBeInTheDocument();
  });

  it("renders null when no data", () => {
    vi.spyOn(useStageQueryModule, "useStageQuery").mockReturnValue({
      data: null,
      isLoading: false,
      error: null,
    } as StageQueryResult);

    const { container } = render(<StagePin stageId="1" />);
    expect(container.firstChild).toBeNull();
  });

  it("renders null when stageId is null", () => {
    vi.spyOn(useStageQueryModule, "useStageQuery").mockReturnValue({
      data: null,
      isLoading: false,
      error: null,
    } as StageQueryResult);

    const { container } = render(<StagePin stageId={null} />);
    expect(container.firstChild).toBeNull();
  });

  it("renders null when loading", () => {
    vi.spyOn(useStageQueryModule, "useStageQuery").mockReturnValue({
      data: null,
      isLoading: true,
      error: null,
    } as unknown as StageQueryResult);

    const { container } = render(<StagePin stageId="1" />);
    expect(container.firstChild).toBeNull();
  });

  it("has correct container classes", () => {
    vi.spyOn(useStageQueryModule, "useStageQuery").mockReturnValue({
      data: { id: "1", name: "Main Stage", color: "#ff0000", archived: false },
      isLoading: false,
      error: null,
    } as StageQueryResult);

    const { container } = render(<StagePin stageId="1" />);
    const wrapper = container.querySelector("div");
    expect(wrapper).toHaveClass("flex", "items-center", "gap-2");
  });

  it("has correct icon size", () => {
    vi.spyOn(useStageQueryModule, "useStageQuery").mockReturnValue({
      data: { id: "1", name: "Main Stage", color: "#ff0000", archived: false },
      isLoading: false,
      error: null,
    } as StageQueryResult);

    const { container } = render(<StagePin stageId="1" />);
    const icon = container.querySelector("svg");
    expect(icon).toHaveClass("h-4", "w-4");
  });

  it("has correct text size", () => {
    vi.spyOn(useStageQueryModule, "useStageQuery").mockReturnValue({
      data: { id: "1", name: "Main Stage", color: "#ff0000", archived: false },
      isLoading: false,
      error: null,
    } as StageQueryResult);

    const { container } = render(<StagePin stageId="1" />);
    const text = container.querySelector("span");
    expect(text).toHaveClass("text-sm");
  });

  it("renders different stage names correctly", () => {
    vi.spyOn(useStageQueryModule, "useStageQuery").mockReturnValue({
      data: {
        id: "2",
        name: "Electronic Stage",
        color: "#00ff00",
        archived: false,
      },
      isLoading: false,
      error: null,
    } as StageQueryResult);

    render(<StagePin stageId="2" />);
    expect(screen.getByText("Electronic Stage")).toBeInTheDocument();
    expect(screen.queryByText("Main Stage")).not.toBeInTheDocument();
  });
});
