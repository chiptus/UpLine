import { LineupDayHeader } from "./LineupDayHeader";
import { LineupFilters } from "./LineupFilters";
import { LineupSetItem } from "./LineupSetItem";
import type { ScheduleDay } from "@/hooks/useScheduleData";

interface StagesLineupGridProps {
  scheduleDays: ScheduleDay[];
  tab: "timeline" | "list";
}

export function StagesLineupGrid({ scheduleDays, tab }: StagesLineupGridProps) {
  const daysWithStages = scheduleDays.filter((day) => day.stages.length > 0);

  if (!daysWithStages.length) {
    return (
      <div className="text-center text-purple-300 py-12">
        <p>No scheduled sets found.</p>
        <div className="mt-4 flex justify-center">
          <LineupFilters tab={tab} />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {daysWithStages.map((day) => (
        <section key={day.date} aria-label={day.displayDate}>
          <LineupDayHeader displayDate={day.displayDate} tab={tab} />
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
        </section>
      ))}
    </div>
  );
}
