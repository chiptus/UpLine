import { useFestivalEdition } from "@/contexts/FestivalEditionContext";

interface FestivalIndicatorProps {
  isTitleVisible?: boolean;
  logoUrl?: string | null;
  title?: string;
}

export function FestivalIndicator({
  isTitleVisible,
  logoUrl,
  title,
}: FestivalIndicatorProps) {
  const { festival } = useFestivalEdition();

  if (isTitleVisible || !logoUrl) {
    return <div className="flex-1" />;
  }

  return (
    <div className="flex-1 flex items-center justify-center">
      <div className="flex items-center gap-2">
        <img
          src={logoUrl}
          alt={`${festival?.name || title} logo`}
          className="size-8 md:size-12 object-contain rounded"
        />
      </div>
    </div>
  );
}
