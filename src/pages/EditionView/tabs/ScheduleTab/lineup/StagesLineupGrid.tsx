import { LineupSetItem } from "./LineupSetItem";
import type { ScheduleDay } from "@/hooks/useScheduleData";

interface StagesLineupGridProps {
  scheduleDays: ScheduleDay[];
}

export function StagesLineupGrid({ scheduleDays }: StagesLineupGridProps) {
  const daysWithStages = scheduleDays.filter((day) => day.stages.length > 0);

  if (!daysWithStages.length) {
    return (
      <div className="text-center text-purple-300 py-12">
        <p>No scheduled sets found.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {daysWithStages.map((day) => (
        <div key={day.date}>
          <h2 className="text-lg font-semibold text-purple-100 mb-4 px-4 py-2 bg-purple-900/40 rounded-lg backdrop-blur-sm sticky top-0 z-10">
            {day.displayDate}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {day.stages.map((stage) => (
              <div key={stage.id} className="bg-white/5 rounded-lg p-3">
                <h3 className="text-purple-200 font-medium mb-3">
                  {stage.name}
                </h3>
                <div className="space-y-2">
                  {stage.sets
                    .slice()
                    .sort((a, b) => a.name.localeCompare(b.name))
                    .map((set) => (
                      <LineupSetItem key={set.id} set={set} />
                    ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
