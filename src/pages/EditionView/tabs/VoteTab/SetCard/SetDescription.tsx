import { CardDescription } from "@/components/ui/card";
import { MultiArtistInfo } from "./MultiArtistInfo";
import { useFestivalSet } from "../FestivalSetContext";
import { MarkdownText } from "@/components/ui/markdown-text";

interface SetDescriptionProps {
  className?: string;
}

export function SetDescription({
  className = "text-purple-200 text-sm leading-relaxed",
}: SetDescriptionProps) {
  const { set } = useFestivalSet();
  const isMultiArtist = set.artists.length > 1;

  if (isMultiArtist) {
    return (
      <CardDescription className={className}>
        <div className="space-y-3">
          {set.description && (
            <MarkdownText
              content={set.description}
              className="prose-sm prose-invert"
            />
          )}
          <div className="flex gap-4 items-center">
            <span className="font-medium">Artists:</span>{" "}
            <MultiArtistInfo artists={set.artists} />
          </div>
        </div>
      </CardDescription>
    );
  }

  if (set.description) {
    return (
      <CardDescription className={className}>
        <MarkdownText
          content={set.description}
          className="prose-sm prose-invert"
        />
      </CardDescription>
    );
  }

  return null;
}
