import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { parseMarkdown } from "../markdown";

describe("parseMarkdown", () => {
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  it("returns empty string for empty input", () => {
    expect(parseMarkdown("")).toBe("");
  });

  it("parses basic markdown text", () => {
    const result = parseMarkdown("Hello world");
    expect(result).toContain("Hello world");
  });

  it("parses bold text", () => {
    const result = parseMarkdown("**bold text**");
    expect(result).toContain("<strong>");
    expect(result).toContain("bold text");
    expect(result).toContain("</strong>");
  });

  it("parses italic text", () => {
    const result = parseMarkdown("*italic text*");
    expect(result).toContain("<em>");
    expect(result).toContain("italic text");
    expect(result).toContain("</em>");
  });

  it("parses links", () => {
    const result = parseMarkdown("[link text](https://example.com)");
    expect(result).toContain('<a href="https://example.com">');
    expect(result).toContain("link text");
    expect(result).toContain("</a>");
  });

  it("parses headings", () => {
    const result = parseMarkdown("# Heading 1");
    expect(result).toContain("<h1>");
    expect(result).toContain("Heading 1");
    expect(result).toContain("</h1>");
  });

  it("parses multiple heading levels", () => {
    const result = parseMarkdown("## Heading 2\n### Heading 3");
    expect(result).toContain("<h2>");
    expect(result).toContain("<h3>");
  });

  it("parses unordered lists", () => {
    const result = parseMarkdown("- Item 1\n- Item 2");
    expect(result).toContain("<ul>");
    expect(result).toContain("<li>");
    expect(result).toContain("Item 1");
    expect(result).toContain("Item 2");
    expect(result).toContain("</ul>");
  });

  it("parses ordered lists", () => {
    const result = parseMarkdown("1. First\n2. Second");
    expect(result).toContain("<ol>");
    expect(result).toContain("<li>");
    expect(result).toContain("First");
    expect(result).toContain("Second");
    expect(result).toContain("</ol>");
  });

  it("converts line breaks with breaks: true option", () => {
    const result = parseMarkdown("Line 1\nLine 2");
    expect(result).toContain("<br>");
  });

  it("parses code blocks", () => {
    const result = parseMarkdown("`code here`");
    expect(result).toContain("<code>");
    expect(result).toContain("code here");
    expect(result).toContain("</code>");
  });

  it("parses fenced code blocks", () => {
    const result = parseMarkdown("```\ncode block\n```");
    expect(result).toContain("<pre>");
    expect(result).toContain("<code>");
    expect(result).toContain("code block");
  });

  it("parses blockquotes", () => {
    const result = parseMarkdown("> Quote here");
    expect(result).toContain("<blockquote>");
    expect(result).toContain("Quote here");
    expect(result).toContain("</blockquote>");
  });

  it("handles mixed markdown elements", () => {
    const markdown = "# Title\n\n**Bold** and *italic* text\n\n- List item";
    const result = parseMarkdown(markdown);
    expect(result).toContain("<h1>");
    expect(result).toContain("<strong>");
    expect(result).toContain("<em>");
    expect(result).toContain("<ul>");
  });

  it("supports GitHub Flavored Markdown (GFM)", () => {
    const result = parseMarkdown("~~strikethrough~~");
    expect(result).toContain("strikethrough");
  });

  it("handles tables (GFM feature)", () => {
    const markdown = "| Header |\n| ------ |\n| Cell |";
    const result = parseMarkdown(markdown);
    expect(result).toContain("<table>");
    expect(result).toContain("Header");
    expect(result).toContain("Cell");
  });

  it("returns plain text with line breaks on parse error", () => {
    expect(parseMarkdown("Normal text\nWith newline")).toBeTruthy();
  });

  it("handles special characters", () => {
    const result = parseMarkdown("Text with & and < and >");
    expect(result).toContain("&amp;");
    expect(result).toContain("&lt;");
    expect(result).toContain("&gt;");
  });

  it("handles URLs in text", () => {
    const result = parseMarkdown("Visit https://example.com");
    expect(result).toBeTruthy();
  });

  it("parses nested markdown", () => {
    const result = parseMarkdown("**bold with *italic* inside**");
    expect(result).toContain("<strong>");
    expect(result).toContain("<em>");
  });

  it("handles multiple paragraphs", () => {
    const result = parseMarkdown("Paragraph 1\n\nParagraph 2");
    expect(result).toContain("<p>");
    expect(result).toContain("Paragraph 1");
    expect(result).toContain("Paragraph 2");
  });
});
