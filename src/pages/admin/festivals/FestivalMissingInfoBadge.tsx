import { useFestivalInfoQuery } from "@/api/festival-info/useFestivalInfo";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { AlertTriangle } from "lucide-react";

export function FestivalMissingInfoBadge({
  festivalId,
}: {
  festivalId: string;
}) {
  const {
    data: festivalInfo,
    isLoading,
    isError,
  } = useFestivalInfoQuery(festivalId);

  if (isLoading || isError || festivalInfo?.info_text) {
    return null;
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          className="inline-flex items-center gap-1 rounded text-xs text-amber-600 hover:text-amber-700"
          aria-label="Missing info — Info tab hidden from visitors"
        >
          <AlertTriangle className="h-3.5 w-3.5" />
          Missing info
        </button>
      </TooltipTrigger>
      <TooltipContent side="right" className="max-w-xs">
        This festival has no info text, so the Info tab won't show to visitors.
        Open the festival's info editor to add details.
      </TooltipContent>
    </Tooltip>
  );
}
