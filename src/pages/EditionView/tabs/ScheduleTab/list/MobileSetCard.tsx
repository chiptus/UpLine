import { Card, CardContent } from "@/components/ui/card";
import { Link, useParams } from "@tanstack/react-router";
import { Clock } from "lucide-react";
import { format, differenceInMinutes } from "date-fns";
import { VoteButtons } from "../VoteButtons";
import { StageBadge } from "@/components/StageBadge";
import type { ScheduleSet } from "@/hooks/useScheduleData";

interface MobileSetCardProps {
  set: ScheduleSet & { stageName: string; stageColor?: string };
}

export function MobileSetCard({ set }: MobileSetCardProps) {
  const { festivalSlug, editionSlug } = useParams();
  const duration =
    set.startTime && set.endTime
      ? differenceInMinutes(set.endTime, set.startTime)
      : null;

  return (
    <Card className="bg-white/10 backdrop-blur-md border-purple-400/30 hover:border-purple-400/50 transition-colors">
      <CardContent className="p-4">
        {/* Artist name */}
        <div className="mb-3">
          <Link
            to="/festivals/$festivalSlug/editions/$editionSlug/sets/$setSlug"
            params={{ festivalSlug, editionSlug, setSlug: set.slug }}
            className="text-white font-semibold hover:text-purple-300 transition-colors block text-lg"
          >
            {set.name}
          </Link>
        </div>

        {/* Stage and duration info */}
        <div className="flex items-center gap-4 mb-3 text-sm text-purple-200">
          <StageBadge
            stageName={set.stageName}
            stageColor={set.stageColor}
            size="sm"
          />

          {duration && (
            <div className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              <span>{duration}min</span>
            </div>
          )}

          {set.startTime && set.endTime && (
            <div className="flex items-center gap-1">
              <span>
                {format(set.startTime, "HH:mm")} -{" "}
                {format(set.endTime, "HH:mm")}
              </span>
            </div>
          )}
        </div>

        <VoteButtons set={set} />
      </CardContent>
    </Card>
  );
}
