import { Badge } from "@/components/ui/badge";
import { Clock } from "lucide-react";
import { FestivalSet } from "@/api/sets/types";
import { StagePin } from "@/components/StagePin";
import { cn } from "@/lib/utils";
import { formatSetSchedule } from "@/lib/setScheduleDisplay";
import { getSetTypeLabel } from "@/lib/setTypeLabels";
import { useScheduleReveal } from "@/hooks/useScheduleReveal";
import { useRouteContext } from "@tanstack/react-router";

interface NonMusicSetBannerProps {
  set: FestivalSet;
  netVoteScore: number;
  use24Hour: boolean;
}

export function NonMusicSetBanner({
  set,
  netVoteScore,
  use24Hour,
}: NonMusicSetBannerProps) {
  const { festival } = useRouteContext({
    from: "/festivals/$festivalSlug/editions/$editionSlug",
  });
  const { canShowStage, level } = useScheduleReveal();
  const { label, icon: Icon, gradient } = getSetTypeLabel(set.set_type);

  const scheduleFormatted = formatSetSchedule(
    set,
    level,
    use24Hour,
    festival.timezone,
  );

  return (
    <div
      className={cn(
        "rounded-lg bg-gradient-to-r p-8 flex items-center gap-6 border",
        gradient,
      )}
    >
      <Icon className="h-16 w-16 shrink-0 text-foreground/60" />
      <div className="min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs uppercase tracking-widest text-foreground/70">
            {label}
          </span>
          {netVoteScore !== 0 && (
            <Badge
              variant="outline"
              className={cn(
                netVoteScore > 0
                  ? "border-green-400 text-green-400"
                  : "border-red-400 text-red-400",
              )}
            >
              Score: {netVoteScore > 0 ? "+" : ""}
              {netVoteScore}
            </Badge>
          )}
        </div>
        <h1 className="text-3xl font-bold text-foreground truncate">
          {set.name}
        </h1>
        <div className="flex flex-wrap gap-4 text-muted-foreground mt-2">
          {canShowStage && <StagePin stageId={set.stage_id} />}
          {scheduleFormatted && (
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              <span className="text-sm">{scheduleFormatted}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
