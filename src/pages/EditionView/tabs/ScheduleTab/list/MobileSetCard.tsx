import { Card, CardContent } from "@/components/ui/card";
import { Link, useParams } from "@tanstack/react-router";
import { Clock } from "lucide-react";
import { differenceInMinutes } from "date-fns";
import { formatTimeOnly } from "@/lib/timeUtils";
import { VoteButtons } from "../VoteButtons";
import { StageBadge } from "@/components/StageBadge";
import type { ScheduleSet } from "@/hooks/useScheduleData";

interface MobileSetCardProps {
  set: ScheduleSet & { stageName: string; stageColor?: string | undefined };
  timezone?: string | undefined;
}

export function MobileSetCard({ set, timezone }: MobileSetCardProps) {
  const { festivalSlug, editionSlug } = useParams({
    from: "/festivals/$festivalSlug/editions/$editionSlug",
  });
  const duration =
    set.startTime && set.endTime
      ? differenceInMinutes(set.endTime, set.startTime)
      : null;

  return (
    <Card className="bg-surface-raised backdrop-blur-md border-border hover:border-strong transition-colors">
      <CardContent className="p-4">
        {/* Artist name */}
        <div className="mb-3">
          <Link
            to="/festivals/$festivalSlug/editions/$editionSlug/sets/$setSlug"
            params={{ festivalSlug, editionSlug, setSlug: set.slug ?? "" }}
            className="text-foreground font-semibold hover:text-subtle-foreground transition-colors block text-lg"
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
                  true,
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
