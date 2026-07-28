import { Calendar } from "lucide-react";
import { cn } from "@/lib/utils";
import { STICKY_TOP_BELOW_TOP_BAR_CLASS } from "@/lib/layout-constants";
import { getFestivalDayLabel } from "@/lib/timeUtils";
import { ScheduleFilterSheet } from "../ScheduleFilterSheet";
import { VoteFilterChips } from "../VoteFilterChips";
import { TimeSlotGroup } from "./TimeSlotGroup";
import type { ScheduleSet } from "@/hooks/useScheduleData";

interface TimeSlot {
  time: Date;
  sets: (ScheduleSet & { stageName: string; stageColor?: string })[];
}

interface ListDayGroupProps {
  dayKey: string;
  slots: TimeSlot[];
  timezone?: string;
}

// The section is the sticky containing block, so the header stays docked
// for the whole day instead of just its first time slot.
export function ListDayGroup({ dayKey, slots, timezone }: ListDayGroupProps) {
  const dayLabel = getFestivalDayLabel(dayKey) ?? undefined;

  return (
    <section aria-label={dayLabel} data-day={dayKey}>
      <header
        className={cn(
          "sticky z-10 mb-4 flex items-center gap-2 rounded-lg border border-purple-400/20 bg-gray-900/95 px-4 py-2 backdrop-blur-md",
          STICKY_TOP_BELOW_TOP_BAR_CLASS,
        )}
      >
        <Calendar className="h-4 w-4 text-purple-300" />
        <h2 className="text-lg font-semibold text-purple-100">{dayLabel}</h2>
        <div className="ml-auto flex items-center gap-1">
          <div className="hidden md:block">
            <VoteFilterChips tab="list" />
          </div>
          <ScheduleFilterSheet tab="list" />
        </div>
      </header>

      <div className="space-y-6">
        {slots.map((slot) => (
          <TimeSlotGroup
            key={slot.time.toISOString()}
            timeSlot={slot}
            timezone={timezone}
          />
        ))}
      </div>
    </section>
  );
}
