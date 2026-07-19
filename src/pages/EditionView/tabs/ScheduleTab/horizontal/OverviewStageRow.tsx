import { cn } from "@/lib/utils";
import { getVoteConfig, VOTE_CONFIG } from "@/lib/voteConfig";
import { calculateOverviewSetBlocks } from "@/lib/timelineOverviewGeometry";
import type { HorizontalTimelineSet } from "@/lib/timelineCalculator";

interface OverviewStageRowProps {
  sets: HorizontalTimelineSet[];
  totalWidth: number;
  votes: Record<string, number> | undefined;
}

/**
 * One thin density row per stage on the mini-map: a block per set,
 * proportionally positioned/sized, colored by the viewer's vote (existing
 * vote colors) or a neutral tone when unvoted / logged out.
 */
export function OverviewStageRow({
  sets,
  totalWidth,
  votes,
}: OverviewStageRowProps) {
  const blocks = calculateOverviewSetBlocks(sets, totalWidth);

  return (
    <div
      data-testid="timeline-overview-stage-row"
      className="relative h-2 rounded-sm bg-white/5"
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
