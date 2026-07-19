import { DEFAULT_STAGE_COLOR } from "@/lib/constants/stages";

interface StageLabelsProps {
  stages: Array<{ name: string; color?: string }>;
}

export function StageLabels({ stages }: StageLabelsProps) {
  return (
    <div className="absolute left-4 top-16 z-20 space-y-16">
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
