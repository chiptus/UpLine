import { Clock } from "lucide-react";
import { formatTimeOnly } from "@/lib/timeUtils";
import { useAuth } from "@/contexts/AuthContext";
import { MobileSetCard } from "./MobileSetCard";
import { cn } from "@/lib/utils";
import type { ScheduleSet } from "@/hooks/useScheduleData";

interface TimeSlot {
  time: Date;
  sets: (ScheduleSet & {
    stageName: string;
    stageColor?: string | undefined;
  })[];
}

interface TimeSlotGroupProps {
  timeSlot: TimeSlot;
  timezone?: string | undefined;
}

export function TimeSlotGroup({ timeSlot, timezone }: TimeSlotGroupProps) {
  const { profile } = useAuth();
  const use24Hour = profile?.use_24_hour ?? true;

  return (
    <div className="relative">
      <div className="flex items-center gap-3 mb-3 px-1">
        <div className="flex items-center gap-2 bg-accent-soft px-3 py-1.5 rounded-full">
          <Clock className="h-3 w-3 text-subtle-foreground" />
          <span className="text-sm font-medium text-muted-foreground">
            {formatTimeOnly(
              timeSlot.time.toISOString(),
              null,
              use24Hour,
              timezone,
            )}
          </span>
        </div>
        <div className="flex-1 h-px bg-border"></div>
      </div>

      <div
        className={cn(
          "grid grid-cols-1 gap-3",
          timeSlot.sets.length > 1 && "lg:grid-cols-2 xl:grid-cols-3",
        )}
      >
        {timeSlot.sets.map((set) => (
          <MobileSetCard key={set.id} set={set} timezone={timezone} />
        ))}
      </div>
    </div>
  );
}
