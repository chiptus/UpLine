interface FestivalIndicatorProps {
  isTitleVisible?: boolean;
  logoUrl?: string | null;
  festivalName?: string;
}

export function FestivalIndicator({
  isTitleVisible,
  logoUrl,
  festivalName,
}: FestivalIndicatorProps) {
  if (isTitleVisible) {
    return <div className="flex-1" />;
  }

  return (
    <div className="flex-1 flex items-center justify-center">
      <div className="flex items-center gap-2 min-w-0 px-4">
        {logoUrl ? (
          <img
            src={logoUrl}
            alt={`${festivalName} logo`}
            className="size-8 md:size-12 object-contain rounded"
          />
        ) : (
          <span className="truncate text-sm md:text-base font-semibold text-white">
            {festivalName}
          </span>
        )}
      </div>
    </div>
  );
}
