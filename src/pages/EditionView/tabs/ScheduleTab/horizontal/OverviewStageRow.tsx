import { cn } from "@/lib/utils";
import { getVoteConfig, VOTE_CONFIG } from "@/lib/voteConfig";
import { calculateOverviewSetBlocks } from "@/lib/timelineOverviewGeometry";
import type { HorizontalTimelineSet } from "@/lib/timelineCalculator";

interface OverviewStageRowProps {
  sets: HorizontalTimelineSet[];
  totalWidth: number;
  votes: Record<string, number> | undefined;
  top: number;
  height: number;
}

/**
 * One thin density row per stage on the mini-map: a block per set,
 * proportionally positioned/sized, colored by the viewer's vote (existing
 * vote colors) or a neutral tone when unvoted / logged out. Absolutely
 * positioned at a caller-computed top/height so the map's total height stays
 * fixed no matter how many stages the festival has.
 */
export function OverviewStageRow({
  sets,
  totalWidth,
  votes,
  top,
  height,
}: OverviewStageRowProps) {
  const blocks = calculateOverviewSetBlocks(sets, totalWidth);

  return (
    <div
      data-testid="timeline-overview-stage-row"
      className="absolute inset-x-0 rounded-sm bg-white/5"
      style={{ top, height }}
    >
      {blocks.map((block) => {
        const voteValue = votes?.[block.id];
        const voteType =
          voteValue !== undefined ? getVoteConfig(voteValue) : undefined;
        const colorClass = voteType
          ? VOTE_CONFIG[voteType].circleColor
          : "bg-purple-400/40";

        return (
          <div
            key={block.id}
            className={cn("absolute top-0 h-full rounded-sm", colorClass)}
            style={{
              left: `${block.leftPercent}%`,
              width: `${Math.max(block.widthPercent, 0.5)}%`,
            }}
          />
        );
      })}
    </div>
  );
}
