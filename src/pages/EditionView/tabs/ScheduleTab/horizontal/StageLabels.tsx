import { DEFAULT_STAGE_COLOR } from "@/lib/constants/stages";

interface StageLabelsProps {
  stages: Array<{ name: string; color?: string }>;
}

// Each label sits in the blank gap directly above its stage's row (the
// row's own space-y-12 gap, 48px), flush against the row's top edge, so it
// never covers a set block — the row track itself has no headroom (its
// cards sit flush at its own top). Must stay in lockstep with the stage
// row stack's own spacing (mt-12 + space-y-12 track height in
// TimelineContainer): label height 48px (h-12) + 96px row height
// (space-y-24) == one row's full 144px period.
export function StageLabels({ stages }: StageLabelsProps) {
  return (
    <div className="absolute top-0 z-20 space-y-24">
      {stages.map((stage) => (
        <div key={stage.name} className="h-12 flex items-end">
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
