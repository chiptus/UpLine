import { SetBlock } from "./SetBlock";
import type { HorizontalTimelineSet } from "@/lib/timelineCalculator";

interface StageRowProps {
  stage: {
    name: string;
    color?: string | undefined;
    sets: HorizontalTimelineSet[];
  };
  totalWidth: number;
  timezone: string;
}

export function StageRow({ stage, totalWidth, timezone }: StageRowProps) {
  return (
    <div key={stage.name} className="flex items-start">
      {/* Timeline Track */}
      <div
        className="relative h-24 bg-surface rounded-lg border-2"
        style={{
          minWidth: totalWidth,
          borderColor: stage.color ? `${stage.color}40` : "#7c3aed33",
        }}
      >
        {stage.sets.map((set) => {
          if (!set.horizontalPosition) return null;

          return (
            <div
              key={set.id}
              // scroll-mt matches the sticky toolbar's height (top-16/top-20)
              // so scrollIntoView doesn't leave the block hidden under it.
              className="absolute h-16 scroll-mt-16 md:scroll-mt-20"
              style={{
                left: `${set.horizontalPosition.left}px`,
                width: `${set.horizontalPosition.width - 4}px`, // Reduce width by 4px for spacing
              }}
            >
              <div className="h-full pr-1">
                <SetBlock set={set} timezone={timezone} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
