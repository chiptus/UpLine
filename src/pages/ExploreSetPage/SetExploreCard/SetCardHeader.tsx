import { Badge } from "@/components/ui/badge";
import { Clock } from "lucide-react";
import { StageBadgeById } from "@/components/StageBadgeById";
import { FestivalSet } from "@/api/sets/types";
import { useScheduleReveal } from "@/hooks/useScheduleReveal";

interface SetCardHeaderProps {
  set: FestivalSet;
  use24Hour: boolean;
}

export function SetCardHeader({ set, use24Hour }: SetCardHeaderProps) {
  const { revealLabels } = useScheduleReveal();
  const { dayLabel, timeLabel, stageId } = revealLabels(set, { use24Hour });

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        {dayLabel && (
          <Badge
            variant="secondary"
            className="bg-accent/80 text-foreground border-0"
          >
            {dayLabel}
          </Badge>
        )}
        {timeLabel && (
          <div className="flex items-center text-sm text-muted-foreground">
            <Clock className="h-4 w-4 mr-1" />
            {timeLabel}
          </div>
        )}
      </div>

      {stageId && <StageBadgeById stageId={stageId} />}
    </div>
  );
}
