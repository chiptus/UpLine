import { LineupSetItem } from "./LineupSetItem";
import type { ScheduleDay } from "@/hooks/useScheduleData";

interface DaysLineupViewProps {
  scheduleDays: ScheduleDay[];
}

export function DaysLineupView({ scheduleDays }: DaysLineupViewProps) {
  const daysWithSets = scheduleDays
    .map((day) => ({
      ...day,
      sets: day.stages
        .flatMap((stage) => stage.sets)
        .sort((a, b) => a.name.localeCompare(b.name)),
    }))
    .filter((day) => day.sets.length > 0);

  if (!daysWithSets.length) {
    return (
      <div className="text-center text-purple-300 py-12">
        <p>No scheduled sets found.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {daysWithSets.map((day) => (
        <div key={day.date}>
          <h2 className="text-lg font-semibold text-purple-100 mb-4 px-4 py-2 bg-purple-900/40 rounded-lg backdrop-blur-sm sticky top-0 z-10">
            {day.displayDate}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {day.sets.map((set) => (
              <LineupSetItem key={set.id} set={set} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
