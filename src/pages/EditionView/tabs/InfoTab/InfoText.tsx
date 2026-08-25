import { MarkdownText } from "@/components/ui/markdown-text";
import { getTextAlignmentClasses } from "@/lib/textAlignment";

interface InfoTextProps {
  infoText?: string;
}

export function InfoText({ infoText }: InfoTextProps) {
  const alignmentClasses = infoText ? getTextAlignmentClasses(infoText) : "";

  return (
    <div className="bg-surface rounded-lg p-6">
      <MarkdownText
        content={infoText || ""}
        className={`prose-sm dark:prose-invert text-foreground ${alignmentClasses}`}
      />
    </div>
  );
}
