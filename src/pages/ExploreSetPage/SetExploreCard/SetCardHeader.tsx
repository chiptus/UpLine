import { Badge } from "@/components/ui/badge";
import { Clock } from "lucide-react";
import { StageBadgeById } from "@/components/StageBadgeById";
import { useScheduleReveal } from "@/hooks/useScheduleReveal";
import { formatTimeOnly } from "@/lib/timeUtils";

interface SetCardHeaderProps {
  stageId?: string | undefined;
  timeStart: string | null;
  use24Hour?: boolean;
}

export function SetCardHeader({
  stageId,
  timeStart,
  use24Hour = true,
}: SetCardHeaderProps) {
  const { canShowStage, canShowDay, canShowTime } = useScheduleReveal();

  function formatTime(dateString: string | null) {
    return formatTimeOnly(dateString, null, use24Hour) ?? "";
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
            className="bg-accent/80 text-foreground border-0"
          >
            {dateLabel}
          </Badge>
        )}
        {timeLabel && (
          <div className="flex items-center text-sm text-muted-foreground">
            <Clock className="h-4 w-4 mr-1" />
            {timeLabel}
          </div>
        )}
      </div>

      {canShowStage && stageId && <StageBadgeById stageId={stageId} />}
    </div>
  );
}
