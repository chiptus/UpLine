import { MarkdownText } from "@/components/ui/markdown-text";
import { getTextAlignmentClasses } from "@/lib/textAlignment";

interface InfoTextProps {
  infoText?: string;
}

export function InfoText({ infoText }: InfoTextProps) {
  const alignmentClasses = infoText ? getTextAlignmentClasses(infoText) : "";

  return (
    <div className="bg-white/5 rounded-lg p-6">
      <MarkdownText
        content={infoText || ""}
        className={`prose-sm prose-invert text-purple-100 ${alignmentClasses}`}
      />
    </div>
  );
}
