import { cn } from "@/lib/utils";
import { getVoteConfig, VOTE_CONFIG } from "@/lib/voteConfig";
import { calculateOverviewSetBlocks } from "@/lib/timelineOverviewGeometry";
import type { HorizontalTimelineSet } from "@/lib/timelineCalculator";
import { DEFAULT_STAGE_COLOR } from "@/lib/constants/stages";

interface OverviewStageRowProps {
  sets: HorizontalTimelineSet[];
  totalWidth: number;
  votes: Record<string, number> | undefined;
  stageColor: string | undefined;
  top: number;
  height: number;
}

/**
 * One thin density row per stage on the mini-map: a block per set,
 * proportionally positioned/sized, colored by the stage's own color at low
 * opacity (so the map reads as colorful before any voting happens) or the
 * viewer's vote color, at full opacity, once they've voted on it.
 * Absolutely positioned at a caller-computed top/height so the map's total
 * height stays fixed no matter how many stages the festival has.
 */
export function OverviewStageRow({
  sets,
  totalWidth,
  votes,
  stageColor,
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

        return (
          <div
            key={block.id}
            className={cn(
              "absolute top-0 h-full rounded-sm",
              voteType && VOTE_CONFIG[voteType].circleColor,
            )}
            style={{
              left: `${block.leftPercent}%`,
              width: `${Math.max(block.widthPercent, 0.5)}%`,
              ...(!voteType && {
                backgroundColor: stageColor || DEFAULT_STAGE_COLOR,
                opacity: 0.4,
              }),
            }}
          />
        );
      })}
    </div>
  );
}
