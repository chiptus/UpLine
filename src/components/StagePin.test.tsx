import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { useSuspenseQuery } from "@tanstack/react-query";
import { StagePin } from "./StagePin";

vi.mock("@tanstack/react-query", async () => {
  const actual = await vi.importActual("@tanstack/react-query");
  return {
    ...actual,
    useSuspenseQuery: vi.fn(),
  };
});

const mockedUseSuspenseQuery = vi.mocked(useSuspenseQuery);

describe("StagePin", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders stage name when data is available", () => {
    mockedUseSuspenseQuery.mockReturnValue({
      data: [
        { id: "1", name: "Main Stage", color: "#ff0000", archived: false },
      ],
    } as ReturnType<typeof useSuspenseQuery>);

    render(<StagePin stageId="1" editionId="edition-1" />);
    expect(screen.getByText("Main Stage")).toBeInTheDocument();
  });

  it("renders MapPin icon when data is available", () => {
    mockedUseSuspenseQuery.mockReturnValue({
      data: [
        { id: "1", name: "Main Stage", color: "#ff0000", archived: false },
      ],
    } as ReturnType<typeof useSuspenseQuery>);

    const { container } = render(
      <StagePin stageId="1" editionId="edition-1" />,
    );
    const icon = container.querySelector("svg");
    expect(icon).toBeInTheDocument();
  });

  it("renders null when no matching stage", () => {
    mockedUseSuspenseQuery.mockReturnValue({
      data: [],
    } as ReturnType<typeof useSuspenseQuery>);

    const { container } = render(
      <StagePin stageId="1" editionId="edition-1" />,
    );
    expect(container.firstChild).toBeNull();
  });

  it("renders null when stageId is null", () => {
    mockedUseSuspenseQuery.mockReturnValue({
      data: [
        { id: "1", name: "Main Stage", color: "#ff0000", archived: false },
      ],
    } as ReturnType<typeof useSuspenseQuery>);

    const { container } = render(
      <StagePin stageId={null} editionId="edition-1" />,
    );
    expect(container.firstChild).toBeNull();
  });

  it("has correct container classes", () => {
    mockedUseSuspenseQuery.mockReturnValue({
      data: [
        { id: "1", name: "Main Stage", color: "#ff0000", archived: false },
      ],
    } as ReturnType<typeof useSuspenseQuery>);

    const { container } = render(
      <StagePin stageId="1" editionId="edition-1" />,
    );
    const wrapper = container.querySelector("div");
    expect(wrapper).toHaveClass("flex", "items-center", "gap-2");
  });

  it("has correct icon size", () => {
    mockedUseSuspenseQuery.mockReturnValue({
      data: [
        { id: "1", name: "Main Stage", color: "#ff0000", archived: false },
      ],
    } as ReturnType<typeof useSuspenseQuery>);

    const { container } = render(
      <StagePin stageId="1" editionId="edition-1" />,
    );
    const icon = container.querySelector("svg");
    expect(icon).toHaveClass("h-4", "w-4");
  });

  it("has correct text size", () => {
    mockedUseSuspenseQuery.mockReturnValue({
      data: [
        { id: "1", name: "Main Stage", color: "#ff0000", archived: false },
      ],
    } as ReturnType<typeof useSuspenseQuery>);

    const { container } = render(
      <StagePin stageId="1" editionId="edition-1" />,
    );
    const text = container.querySelector("span");
    expect(text).toHaveClass("text-sm");
  });

  it("renders different stage names correctly", () => {
    mockedUseSuspenseQuery.mockReturnValue({
      data: [
        {
          id: "2",
          name: "Electronic Stage",
          color: "#00ff00",
          archived: false,
        },
      ],
    } as ReturnType<typeof useSuspenseQuery>);

    render(<StagePin stageId="2" editionId="edition-1" />);
    expect(screen.getByText("Electronic Stage")).toBeInTheDocument();
    expect(screen.queryByText("Main Stage")).not.toBeInTheDocument();
  });
});
