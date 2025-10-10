import { parseMarkdown } from "@/lib/markdown";
import { cn } from "@/lib/utils";

interface MarkdownTextProps {
  content: string;
  className?: string;
}

export function MarkdownText({ content, className }: MarkdownTextProps) {
  if (!content) return null;

  const html = parseMarkdown(content);

  return (
    <div
      className={cn(
        "prose prose-sm max-w-none",
        "prose-headings:text-foreground prose-p:text-foreground prose-strong:text-foreground",
        "prose-a:text-primary hover:prose-a:text-primary/80",
        "prose-code:text-foreground prose-pre:bg-muted",
        "prose-blockquote:text-muted-foreground prose-blockquote:border-l-border",
        className,
      )}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
