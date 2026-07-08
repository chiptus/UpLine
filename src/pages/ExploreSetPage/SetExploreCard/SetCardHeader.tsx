import { Badge } from "@/components/ui/badge";
import { Clock } from "lucide-react";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useRouteContext } from "@tanstack/react-router";
import { StageBadge } from "@/components/StageBadge";
import { stagesByEditionQuery } from "@/api/stages/useStagesByEdition";
import { useScheduleReveal } from "@/hooks/useScheduleReveal";

interface SetCardHeaderProps {
  stageId?: string;
  timeStart: string | null;
}

export function SetCardHeader({ stageId, timeStart }: SetCardHeaderProps) {
  const { edition } = useRouteContext({
    from: "/festivals/$festivalSlug/editions/$editionSlug",
  });
  const { canShowStage, canShowDay, canShowTime } = useScheduleReveal();
  const { data: stages } = useSuspenseQuery(stagesByEditionQuery(edition.id));
  const stage = canShowStage
    ? stages.find((s) => s.id === stageId)
    : undefined;

  function formatTime(dateString: string | null) {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
  }

  function formatDate(dateString: string | null) {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
  }

  const dateLabel = canShowDay ? formatDate(timeStart) : "";
  const timeLabel = canShowTime && timeStart ? formatTime(timeStart) : "";

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        {dateLabel && (
          <Badge
            variant="secondary"
            className="bg-purple-600/80 text-white border-0"
          >
            {dateLabel}
          </Badge>
        )}
        {timeLabel && (
          <div className="flex items-center text-sm text-gray-300">
            <Clock className="h-4 w-4 mr-1" />
            {timeLabel}
          </div>
        )}
      </div>

      {stage && (
        <StageBadge
          stageName={stage.name}
          stageColor={stage.color || undefined}
          size="sm"
        />
      )}
    </div>
  );
}
