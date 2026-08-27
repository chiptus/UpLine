import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { SetTypeIcon } from "./SetTypeIcon";

describe("SetTypeIcon", () => {
  it("renders nothing for music sets", () => {
    const { container } = render(<SetTypeIcon setType="music" />);
    expect(container).toBeEmptyDOMElement();
  });

  it("renders nothing for untyped sets", () => {
    const { container } = render(<SetTypeIcon setType={null} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("renders nothing for unknown type values", () => {
    const { container } = render(<SetTypeIcon setType="talk" />);
    expect(container).toBeEmptyDOMElement();
  });

  it("renders a labeled icon for workshop sets", () => {
    render(<SetTypeIcon setType="workshop" />);
    expect(screen.getByLabelText("Workshop")).toBeInTheDocument();
  });

  it("renders a labeled icon for performance and other sets", () => {
    render(<SetTypeIcon setType="performance" />);
    expect(screen.getByLabelText("Performance")).toBeInTheDocument();

    render(<SetTypeIcon setType="other" />);
    expect(screen.getByLabelText("Other")).toBeInTheDocument();
  });

  it("merges a custom className", () => {
    render(<SetTypeIcon setType="workshop" className="h-3 w-3" />);
    expect(screen.getByLabelText("Workshop")).toHaveClass("h-3", "w-3");
  });
});
