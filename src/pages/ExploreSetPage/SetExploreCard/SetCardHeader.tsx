import { Badge } from "@/components/ui/badge";
import { Clock } from "lucide-react";
import { StageBadgeById } from "@/components/StageBadgeById";
import { useScheduleReveal } from "@/hooks/useScheduleReveal";

interface SetCardHeaderProps {
  stageId?: string;
  timeStart: string | null;
}

export function SetCardHeader({ stageId, timeStart }: SetCardHeaderProps) {
  const { canShowStage, canShowDay, canShowTime } = useScheduleReveal();

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

      {canShowStage && stageId && <StageBadgeById stageId={stageId} />}
    </div>
  );
}
