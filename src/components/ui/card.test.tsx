import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "./card";

describe("Card", () => {
  it("renders children content", () => {
    render(<Card>Card Content</Card>);
    expect(screen.getByText("Card Content")).toBeInTheDocument();
  });

  it("has base classes", () => {
    const { container } = render(<Card>Test</Card>);
    const card = container.firstChild as HTMLElement;
    expect(card).toHaveClass(
      "rounded-lg",
      "border",
      "bg-card",
      "text-card-foreground",
      "shadow-sm",
    );
  });

  it("applies custom className", () => {
    const { container } = render(<Card className="custom-class">Test</Card>);
    const card = container.firstChild as HTMLElement;
    expect(card).toHaveClass("custom-class");
  });

  it("forwards ref", () => {
    const ref = { current: null };
    render(<Card ref={ref}>Test</Card>);
    expect(ref.current).toBeInstanceOf(HTMLDivElement);
  });

  it("passes through HTML attributes", () => {
    render(<Card data-testid="custom-card">Test</Card>);
    expect(screen.getByTestId("custom-card")).toBeInTheDocument();
  });
});

describe("CardHeader", () => {
  it("renders children content", () => {
    render(<CardHeader>Header Content</CardHeader>);
    expect(screen.getByText("Header Content")).toBeInTheDocument();
  });

  it("has base classes", () => {
    const { container } = render(<CardHeader>Test</CardHeader>);
    const header = container.firstChild as HTMLElement;
    expect(header).toHaveClass("flex", "flex-col", "space-y-1.5", "p-6");
  });

  it("applies custom className", () => {
    const { container } = render(
      <CardHeader className="custom-header">Test</CardHeader>,
    );
    const header = container.firstChild as HTMLElement;
    expect(header).toHaveClass("custom-header");
  });

  it("forwards ref", () => {
    const ref = { current: null };
    render(<CardHeader ref={ref}>Test</CardHeader>);
    expect(ref.current).toBeInstanceOf(HTMLDivElement);
  });
});

describe("CardTitle", () => {
  it("renders children content", () => {
    render(<CardTitle>Title Text</CardTitle>);
    expect(screen.getByText("Title Text")).toBeInTheDocument();
  });

  it("renders as h3 element", () => {
    render(<CardTitle>Title</CardTitle>);
    expect(screen.getByRole("heading", { level: 3 })).toBeInTheDocument();
  });

  it("has base classes", () => {
    const { container } = render(<CardTitle>Test</CardTitle>);
    const title = container.querySelector("h3");
    expect(title).toHaveClass(
      "text-2xl",
      "font-semibold",
      "leading-none",
      "tracking-tight",
    );
  });

  it("applies custom className", () => {
    const { container } = render(
      <CardTitle className="custom-title">Test</CardTitle>,
    );
    const title = container.querySelector("h3");
    expect(title).toHaveClass("custom-title");
  });

  it("forwards ref", () => {
    const ref = { current: null };
    render(<CardTitle ref={ref}>Test</CardTitle>);
    expect(ref.current).toBeInstanceOf(HTMLHeadingElement);
  });
});

describe("CardDescription", () => {
  it("renders children content", () => {
    render(<CardDescription>Description Text</CardDescription>);
    expect(screen.getByText("Description Text")).toBeInTheDocument();
  });

  it("has base classes", () => {
    const { container } = render(<CardDescription>Test</CardDescription>);
    const description = container.firstChild as HTMLElement;
    expect(description).toHaveClass("text-sm", "text-paper-muted-foreground");
  });

  it("applies custom className", () => {
    const { container } = render(
      <CardDescription className="custom-desc">Test</CardDescription>,
    );
    const description = container.firstChild as HTMLElement;
    expect(description).toHaveClass("custom-desc");
  });

  it("forwards ref", () => {
    const ref = { current: null };
    render(<CardDescription ref={ref}>Test</CardDescription>);
    expect(ref.current).toBeInstanceOf(HTMLDivElement);
  });
});

describe("CardContent", () => {
  it("renders children content", () => {
    render(<CardContent>Content Text</CardContent>);
    expect(screen.getByText("Content Text")).toBeInTheDocument();
  });

  it("has base classes", () => {
    const { container } = render(<CardContent>Test</CardContent>);
    const content = container.firstChild as HTMLElement;
    expect(content).toHaveClass("p-6", "pt-0");
  });

  it("applies custom className", () => {
    const { container } = render(
      <CardContent className="custom-content">Test</CardContent>,
    );
    const content = container.firstChild as HTMLElement;
    expect(content).toHaveClass("custom-content");
  });

  it("forwards ref", () => {
    const ref = { current: null };
    render(<CardContent ref={ref}>Test</CardContent>);
    expect(ref.current).toBeInstanceOf(HTMLDivElement);
  });
});

describe("CardFooter", () => {
  it("renders children content", () => {
    render(<CardFooter>Footer Content</CardFooter>);
    expect(screen.getByText("Footer Content")).toBeInTheDocument();
  });

  it("has base classes", () => {
    const { container } = render(<CardFooter>Test</CardFooter>);
    const footer = container.firstChild as HTMLElement;
    expect(footer).toHaveClass("flex", "items-center", "p-6", "pt-0");
  });

  it("applies custom className", () => {
    const { container } = render(
      <CardFooter className="custom-footer">Test</CardFooter>,
    );
    const footer = container.firstChild as HTMLElement;
    expect(footer).toHaveClass("custom-footer");
  });

  it("forwards ref", () => {
    const ref = { current: null };
    render(<CardFooter ref={ref}>Test</CardFooter>);
    expect(ref.current).toBeInstanceOf(HTMLDivElement);
  });
});

describe("Card composition", () => {
  it("renders a complete card with all components", () => {
    render(
      <Card>
        <CardHeader>
          <CardTitle>Test Title</CardTitle>
          <CardDescription>Test Description</CardDescription>
        </CardHeader>
        <CardContent>Test Content</CardContent>
        <CardFooter>Test Footer</CardFooter>
      </Card>,
    );

    expect(screen.getByText("Test Title")).toBeInTheDocument();
    expect(screen.getByText("Test Description")).toBeInTheDocument();
    expect(screen.getByText("Test Content")).toBeInTheDocument();
    expect(screen.getByText("Test Footer")).toBeInTheDocument();
  });

  it("maintains proper hierarchy", () => {
    const { container } = render(
      <Card>
        <CardHeader>
          <CardTitle>Title</CardTitle>
        </CardHeader>
      </Card>,
    );

    const card = container.firstChild as HTMLElement;
    const header = card.querySelector("div");
    const title = header?.querySelector("h3") ?? null;

    expect(card).toContainElement(header);
    expect(header).toContainElement(title);
  });
});
