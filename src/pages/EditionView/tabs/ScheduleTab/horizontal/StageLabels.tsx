import { DEFAULT_STAGE_COLOR } from "@/lib/constants/stages";
import { cn } from "@/lib/utils";

interface StageLabelsProps {
  stages: Array<{ name: string; color?: string }>;
  /** PROTOTYPE: sticky-header variants shift labels up (see prototype/). */
  className?: string;
}

export function StageLabels({ stages, className }: StageLabelsProps) {
  return (
    <div className={cn("absolute top-12 z-20 space-y-16", className)}>
      {stages.map((stage) => (
        <div key={stage.name} className="h-20 flex items-center">
          <div
            className="text-sm font-medium text-white px-2 py-1 rounded"
            style={{
              backgroundColor: stage.color || DEFAULT_STAGE_COLOR,
            }}
          >
            {stage.name}
          </div>
        </div>
      ))}
    </div>
  );
}
