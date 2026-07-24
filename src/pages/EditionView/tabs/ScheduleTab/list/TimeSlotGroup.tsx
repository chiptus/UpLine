import { Clock, Calendar } from "lucide-react";
import { formatDayOnly, formatTimeOnly } from "@/lib/timeUtils";
import { MobileSetCard } from "./MobileSetCard";
import type { ScheduleSet } from "@/hooks/useScheduleData";
import { cn } from "@/lib/utils";
// PROTOTYPE: chrome-variant exploration (see ../../../prototype/)
import { useChromeVariant } from "../../../prototype/chromeVariant";

interface TimeSlot {
  time: Date;
  sets: (ScheduleSet & { stageName: string; stageColor?: string })[];
}

interface TimeSlotGroupProps {
  timeSlot: TimeSlot;
  showDateHeader: boolean;
  timezone?: string;
}

export function TimeSlotGroup({
  timeSlot,
  showDateHeader,
  timezone,
}: TimeSlotGroupProps) {
  // PROTOTYPE: non-current variants stick day headers below the fixed top bar
  const variant = useChromeVariant();

  return (
    <div>
      {showDateHeader && (
        <div
          className={cn(
            "flex items-center gap-2 mb-4 px-4 py-2 rounded-lg sticky z-10",
            variant === "current" && "bg-purple-900/40 backdrop-blur-sm top-0",
            (variant === "tabs" ||
              variant === "thumbbar" ||
              variant === "autohide") &&
              "bg-purple-900/80 backdrop-blur-md top-16 md:top-20",
            variant === "unibar" &&
              "bg-purple-900/80 backdrop-blur-md top-28 md:top-32",
          )}
        >
          <Calendar className="h-4 w-4 text-purple-300" />
          <h2 className="text-lg font-semibold text-purple-100">
            {formatDayOnly(timeSlot.time.toISOString(), timezone)}
          </h2>
        </div>
      )}

      <div className="relative">
        {/* Time indicator */}
        <div className="flex items-center gap-3 mb-3 px-1">
          <div className="flex items-center gap-2 bg-purple-800/50 px-3 py-1.5 rounded-full">
            <Clock className="h-3 w-3 text-purple-300" />
            <span className="text-sm font-medium text-purple-200">
              {formatTimeOnly(
                timeSlot.time.toISOString(),
                null,
                true,
                timezone,
              )}
            </span>
          </div>
          <div className="flex-1 h-px bg-purple-400/20"></div>
        </div>

        <div className="space-y-3">
          {/* Mobile: Stack all sets vertically */}
          <div className="block md:hidden space-y-3">
            {timeSlot.sets.map((set) => (
              <MobileSetCard key={set.id} set={set} timezone={timezone} />
            ))}
          </div>

          {/* Desktop: Show sets side by side when space allows */}
          <div className="hidden md:block">
            {timeSlot.sets.length === 1 ? (
              <MobileSetCard
                key={timeSlot.sets[0].id}
                set={timeSlot.sets[0]}
                timezone={timezone}
              />
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-3">
                {timeSlot.sets.map((set) => (
                  <MobileSetCard key={set.id} set={set} timezone={timezone} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
