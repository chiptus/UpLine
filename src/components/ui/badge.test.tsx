import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { Badge } from "./badge";

describe("Badge", () => {
  it("renders children content", () => {
    render(<Badge>Test Badge</Badge>);
    expect(screen.getByText("Test Badge")).toBeInTheDocument();
  });

  it("renders with default variant", () => {
    const { container } = render(<Badge>Default</Badge>);
    const badge = container.querySelector("div");
    expect(badge).toHaveClass("bg-primary", "text-primary-foreground");
  });

  it("renders with secondary variant", () => {
    const { container } = render(<Badge variant="secondary">Secondary</Badge>);
    const badge = container.querySelector("div");
    expect(badge).toHaveClass("bg-secondary", "text-secondary-foreground");
  });

  it("renders with destructive variant", () => {
    const { container } = render(
      <Badge variant="destructive">Destructive</Badge>,
    );
    const badge = container.querySelector("div");
    expect(badge).toHaveClass("bg-destructive", "text-destructive-foreground");
  });

  it("renders with outline variant", () => {
    const { container } = render(<Badge variant="outline">Outline</Badge>);
    const badge = container.querySelector("div");
    expect(badge).toHaveClass("text-paper-foreground", "border-paper-border");
  });

  it("applies custom className", () => {
    const { container } = render(
      <Badge className="custom-class">Custom</Badge>,
    );
    const badge = container.querySelector("div");
    expect(badge).toHaveClass("custom-class");
  });

  it("has base classes", () => {
    const { container } = render(<Badge>Base</Badge>);
    const badge = container.querySelector("div");
    expect(badge).toHaveClass(
      "inline-flex",
      "items-center",
      "rounded-full",
      "border",
      "px-2.5",
      "py-0.5",
      "text-xs",
      "font-semibold",
    );
  });

  it("passes through HTML attributes", () => {
    render(
      <Badge data-testid="custom-badge" title="Badge Title">
        Test
      </Badge>,
    );
    const badge = screen.getByTestId("custom-badge");
    expect(badge).toHaveAttribute("title", "Badge Title");
  });

  it("renders as div element", () => {
    const { container } = render(<Badge>Test</Badge>);
    const badge = container.querySelector("div");
    expect(badge?.tagName).toBe("DIV");
  });

  it("combines custom className with variant classes", () => {
    const { container } = render(
      <Badge variant="secondary" className="my-custom-class">
        Combined
      </Badge>,
    );
    const badge = container.querySelector("div");
    expect(badge).toHaveClass("bg-secondary");
    expect(badge).toHaveClass("my-custom-class");
  });
});
