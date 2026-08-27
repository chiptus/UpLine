import { Card, CardContent } from "@/components/ui/card";
import { Link, useParams } from "@tanstack/react-router";
import { Clock } from "lucide-react";
import { differenceInMinutes } from "date-fns";
import { formatTimeOnly } from "@/lib/timeUtils";
import { useTimeFormat } from "@/hooks/useTimeFormat";
import { VoteButtons } from "../VoteButtons";
import { StageBadge } from "@/components/StageBadge";
import { isNonMusicSetType } from "@/api/sets/types";
import { SetTypeIcon } from "@/components/SetTypeIcon";
import { cn } from "@/lib/utils";
import type { ScheduleSet } from "@/hooks/useScheduleData";

interface MobileSetCardProps {
  set: ScheduleSet & { stageName: string; stageColor?: string | undefined };
  timezone?: string | undefined;
}

export function MobileSetCard({ set, timezone }: MobileSetCardProps) {
  const { festivalSlug, editionSlug } = useParams({
    from: "/festivals/$festivalSlug/editions/$editionSlug",
  });
  const use24Hour = useTimeFormat();
  const duration =
    set.startTime && set.endTime
      ? differenceInMinutes(set.endTime, set.startTime)
      : null;

  return (
    <Card className="bg-surface-raised backdrop-blur-md border-border hover:border-strong transition-colors">
      <CardContent className="p-4">
        {/* Artist name */}
        <div
          className={cn(
            "mb-3",
            isNonMusicSetType(set.setType) && "flex items-center gap-2",
          )}
        >
          <SetTypeIcon setType={set.setType} className="h-4 w-4" />
          <Link
            to="/festivals/$festivalSlug/editions/$editionSlug/sets/$setSlug"
            params={{ festivalSlug, editionSlug, setSlug: set.slug ?? "" }}
            className={cn(
              "text-foreground font-semibold hover:text-subtle-foreground transition-colors block text-lg",
              isNonMusicSetType(set.setType) && "min-w-0",
            )}
          >
            {set.name}
          </Link>
        </div>

        {/* Stage and duration info */}
        <div className="flex items-center gap-4 mb-3 text-sm text-muted-foreground">
          {set.stageName && (
            <StageBadge
              stageName={set.stageName}
              stageColor={set.stageColor}
              size="sm"
            />
          )}

          {duration && (
            <div className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              <span>{duration}min</span>
            </div>
          )}

          {set.startTime && set.endTime && (
            <div className="flex items-center gap-1">
              <span>
                {formatTimeOnly(
                  set.startTime.toISOString(),
                  set.endTime.toISOString(),
                  use24Hour,
                  timezone,
                )}
              </span>
            </div>
          )}
        </div>

        <VoteButtons set={set} />
      </CardContent>
    </Card>
  );
}
