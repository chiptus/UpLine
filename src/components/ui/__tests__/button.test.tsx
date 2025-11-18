import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Button } from "../button";

describe("Button", () => {
  it("renders children content", () => {
    render(<Button>Click me</Button>);
    expect(screen.getByRole("button", { name: "Click me" })).toBeInTheDocument();
  });

  it("renders with default variant", () => {
    const { container } = render(<Button>Default</Button>);
    const button = container.querySelector("button");
    expect(button).toHaveClass("bg-primary", "text-primary-foreground");
  });

  it("renders with destructive variant", () => {
    const { container } = render(<Button variant="destructive">Delete</Button>);
    const button = container.querySelector("button");
    expect(button).toHaveClass("bg-destructive", "text-destructive-foreground");
  });

  it("renders with outline variant", () => {
    const { container } = render(<Button variant="outline">Outline</Button>);
    const button = container.querySelector("button");
    expect(button).toHaveClass("border", "border-input", "bg-background");
  });

  it("renders with secondary variant", () => {
    const { container } = render(<Button variant="secondary">Secondary</Button>);
    const button = container.querySelector("button");
    expect(button).toHaveClass("bg-secondary", "text-secondary-foreground");
  });

  it("renders with ghost variant", () => {
    const { container } = render(<Button variant="ghost">Ghost</Button>);
    const button = container.querySelector("button");
    expect(button).toHaveClass("hover:bg-accent");
  });

  it("renders with link variant", () => {
    const { container } = render(<Button variant="link">Link</Button>);
    const button = container.querySelector("button");
    expect(button).toHaveClass("text-primary", "underline-offset-4");
  });

  it("renders with default size", () => {
    const { container } = render(<Button>Default Size</Button>);
    const button = container.querySelector("button");
    expect(button).toHaveClass("h-10", "px-4", "py-2");
  });

  it("renders with small size", () => {
    const { container } = render(<Button size="sm">Small</Button>);
    const button = container.querySelector("button");
    expect(button).toHaveClass("h-9", "px-3");
  });

  it("renders with large size", () => {
    const { container } = render(<Button size="lg">Large</Button>);
    const button = container.querySelector("button");
    expect(button).toHaveClass("h-11", "px-8");
  });

  it("renders with icon size", () => {
    const { container } = render(<Button size="icon">Icon</Button>);
    const button = container.querySelector("button");
    expect(button).toHaveClass("h-10", "w-10");
  });

  it("handles click events", async () => {
    const user = userEvent.setup();
    const handleClick = vi.fn();
    render(<Button onClick={handleClick}>Click me</Button>);
    await user.click(screen.getByRole("button"));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it("is disabled when disabled prop is true", () => {
    render(<Button disabled>Disabled</Button>);
    const button = screen.getByRole("button");
    expect(button).toBeDisabled();
  });

  it("does not trigger click when disabled", async () => {
    const user = userEvent.setup();
    const handleClick = vi.fn();
    render(<Button disabled onClick={handleClick}>Disabled</Button>);
    await user.click(screen.getByRole("button"));
    expect(handleClick).not.toHaveBeenCalled();
  });

  it("applies custom className", () => {
    const { container } = render(<Button className="custom-class">Custom</Button>);
    const button = container.querySelector("button");
    expect(button).toHaveClass("custom-class");
  });

  it("has base classes", () => {
    const { container } = render(<Button>Base</Button>);
    const button = container.querySelector("button");
    expect(button).toHaveClass(
      "inline-flex",
      "items-center",
      "justify-center",
      "rounded-md",
      "text-sm",
      "font-medium",
    );
  });

  it("passes through HTML attributes", () => {
    render(<Button type="submit" data-testid="submit-btn">Submit</Button>);
    const button = screen.getByTestId("submit-btn");
    expect(button).toHaveAttribute("type", "submit");
  });

  it("renders as button element by default", () => {
    render(<Button>Default Button</Button>);
    expect(screen.getByRole("button")).toBeTruthy();
  });

  it("combines variant and size classes", () => {
    const { container } = render(<Button variant="destructive" size="lg">Large Delete</Button>);
    const button = container.querySelector("button");
    expect(button).toHaveClass("bg-destructive");
    expect(button).toHaveClass("h-11", "px-8");
  });

  it("forwards ref to button element", () => {
    const ref = { current: null };
    render(<Button ref={ref}>Ref Button</Button>);
    expect(ref.current).toBeInstanceOf(HTMLButtonElement);
  });
});
