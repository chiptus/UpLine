import { marked } from "marked";

// Configure marked for safe HTML output
marked.setOptions({
  breaks: true,
  gfm: true,
});

export function parseMarkdown(markdown: string): string {
  if (!markdown) return "";

  try {
    return marked.parse(markdown, {}) as string;
  } catch (error) {
    console.error("Error parsing markdown:", error);
    // Fallback to plain text with line breaks
    return markdown.replace(/\n/g, "<br>");
  }
}
