import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { StageBadge } from "./StageBadge";

describe("StageBadge", () => {
  it("renders stage name", () => {
    render(<StageBadge stageName="Main Stage" />);
    expect(screen.getByText("Main Stage")).toBeInTheDocument();
  });

  it("renders with custom color", () => {
    const { container } = render(
      <StageBadge stageName="Main Stage" stageColor="#ff0000" />,
    );
    const badge = container.querySelector("div");
    expect(badge).toHaveStyle({
      backgroundColor: "#ff000080",
      borderColor: "#ff0000",
    });
  });

  it("renders with default color when no color provided", () => {
    const { container } = render(<StageBadge stageName="Main Stage" />);
    const badge = container.querySelector("div");
    expect(badge).toHaveStyle({
      backgroundColor: "#7c3aed80",
      borderColor: "#7c3aed",
    });
  });

  it("renders small size by default", () => {
    const { container } = render(<StageBadge stageName="Main Stage" />);
    const badge = container.querySelector("div");
    expect(badge).toHaveClass("text-xs", "px-2", "py-1", "gap-1");
  });

  it("renders medium size when specified", () => {
    const { container } = render(
      <StageBadge stageName="Main Stage" size="md" />,
    );
    const badge = container.querySelector("div");
    expect(badge).toHaveClass("text-sm", "px-3", "py-1.5", "gap-2");
  });

  it("shows icon by default", () => {
    const { container } = render(<StageBadge stageName="Main Stage" />);
    const icon = container.querySelector("svg");
    expect(icon).toBeInTheDocument();
  });

  it("hides icon when showIcon is false", () => {
    const { container } = render(
      <StageBadge stageName="Main Stage" showIcon={false} />,
    );
    const icon = container.querySelector("svg");
    expect(icon).not.toBeInTheDocument();
  });

  it("applies correct icon size for small badge", () => {
    const { container } = render(
      <StageBadge stageName="Main Stage" size="sm" />,
    );
    const icon = container.querySelector("svg");
    expect(icon).toHaveClass("h-3", "w-3");
  });

  it("applies correct icon size for medium badge", () => {
    const { container } = render(
      <StageBadge stageName="Main Stage" size="md" />,
    );
    const icon = container.querySelector("svg");
    expect(icon).toHaveClass("h-4", "w-4");
  });

  it("renders with all custom props", () => {
    const { container } = render(
      <StageBadge
        stageName="Custom Stage"
        stageColor="#00ff00"
        size="md"
        showIcon={true}
      />,
    );
    expect(screen.getByText("Custom Stage")).toBeInTheDocument();
    const badge = container.querySelector("div");
    expect(badge).toHaveStyle({
      backgroundColor: "#00ff0080",
      borderColor: "#00ff00",
    });
    expect(badge).toHaveClass("text-sm");
    expect(container.querySelector("svg")).toBeInTheDocument();
  });

  it("has correct base classes", () => {
    const { container } = render(<StageBadge stageName="Main Stage" />);
    const badge = container.querySelector("div");
    expect(badge).toHaveClass(
      "inline-flex",
      "items-center",
      "rounded-full",
      "backdrop-blur-sm",
      "border",
      "text-white",
      "font-medium",
    );
  });
});
