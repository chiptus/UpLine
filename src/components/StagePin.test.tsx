import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { StagePin } from "./StagePin";
import * as reactRouter from "@tanstack/react-router";
import * as reactQuery from "@tanstack/react-query";

vi.mock("@tanstack/react-router");
vi.mock("@tanstack/react-query");

const stages = [
  { id: "1", name: "Main Stage", color: "#ff0000", archived: false },
  { id: "2", name: "Electronic Stage", color: "#00ff00", archived: false },
];

function mockStages(data: typeof stages) {
  vi.spyOn(reactRouter, "useRouteContext").mockReturnValue({
    edition: { id: "edition-1" },
  } as ReturnType<typeof reactRouter.useRouteContext>);
  vi.spyOn(reactQuery, "useSuspenseQuery").mockReturnValue({
    data,
  } as ReturnType<typeof reactQuery.useSuspenseQuery>);
}

describe("StagePin", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders stage name when data is available", () => {
    mockStages(stages);

    render(<StagePin stageId="1" />);
    expect(screen.getByText("Main Stage")).toBeInTheDocument();
  });

  it("renders MapPin icon when data is available", () => {
    mockStages(stages);

    const { container } = render(<StagePin stageId="1" />);
    const icon = container.querySelector("svg");
    expect(icon).toBeInTheDocument();
  });

  it("renders null when no matching stage", () => {
    mockStages(stages);

    const { container } = render(<StagePin stageId="does-not-exist" />);
    expect(container.firstChild).toBeNull();
  });

  it("renders null when stageId is null", () => {
    mockStages(stages);

    const { container } = render(<StagePin stageId={null} />);
    expect(container.firstChild).toBeNull();
  });

  it("renders null when stages list is empty", () => {
    mockStages([]);

    const { container } = render(<StagePin stageId="1" />);
    expect(container.firstChild).toBeNull();
  });

  it("has correct container classes", () => {
    mockStages(stages);

    const { container } = render(<StagePin stageId="1" />);
    const wrapper = container.querySelector("div");
    expect(wrapper).toHaveClass("flex", "items-center", "gap-2");
  });

  it("has correct icon size", () => {
    mockStages(stages);

    const { container } = render(<StagePin stageId="1" />);
    const icon = container.querySelector("svg");
    expect(icon).toHaveClass("h-4", "w-4");
  });

  it("has correct text size", () => {
    mockStages(stages);

    const { container } = render(<StagePin stageId="1" />);
    const text = container.querySelector("span");
    expect(text).toHaveClass("text-sm");
  });

  it("renders different stage names correctly", () => {
    mockStages(stages);

    render(<StagePin stageId="2" />);
    expect(screen.getByText("Electronic Stage")).toBeInTheDocument();
    expect(screen.queryByText("Main Stage")).not.toBeInTheDocument();
  });
});
