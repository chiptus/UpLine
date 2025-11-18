import { Badge } from "@/components/ui/badge";
import { Calendar, Clock } from "lucide-react";
import { SchedulePhaseInfo } from "@/hooks/useSchedulePhase";

interface SchedulePhaseIndicatorProps {
  phaseInfo: SchedulePhaseInfo;
  showProgress?: boolean;
}

export function SchedulePhaseIndicator({
  phaseInfo,
  showProgress = true,
}: SchedulePhaseIndicatorProps) {
  const { phase, scheduleProgress, scheduledCount, totalCount } = phaseInfo;

  if (phase === "pre-schedule") {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Calendar className="h-4 w-4" />
        <span>Pre-Schedule Phase</span>
        <Badge variant="outline" className="ml-2">
          Artist Discovery
        </Badge>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 text-sm text-muted-foreground">
      <Clock className="h-4 w-4" />
      <span>Schedule Available</span>
      {showProgress && scheduleProgress < 1 && (
        <Badge variant="outline" className="ml-2">
          {scheduledCount}/{totalCount} sets scheduled
        </Badge>
      )}
      {showProgress && scheduleProgress === 1 && (
        <Badge variant="default" className="ml-2">
          Full Schedule
        </Badge>
      )}
    </div>
  );
}
