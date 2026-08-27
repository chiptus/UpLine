import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Clock, ExternalLink } from "lucide-react";
import { FestivalSet } from "@/api/sets/types";
import { SetVotingButtons } from "@/pages/SetDetails/SetVotingButtons";
import { SetTypePlaceholder } from "@/components/SetTypePlaceholder";
import { StagePin } from "@/components/StagePin";
import { MarkdownText } from "@/components/ui/markdown-text";
import { cn } from "@/lib/utils";
import { formatDayOnly, formatTimeRange } from "@/lib/timeUtils";
import { getSetTypeLabel } from "@/lib/setTypeLabels";
import { useScheduleReveal } from "@/hooks/useScheduleReveal";
import { useRouteContext } from "@tanstack/react-router";

interface NonMusicSetDetailProps {
  set: FestivalSet;
  netVoteScore: number;
  use24Hour: boolean;
}

export function NonMusicSetDetail({
  set,
  netVoteScore,
  use24Hour,
}: NonMusicSetDetailProps) {
  const { festival } = useRouteContext({
    from: "/festivals/$festivalSlug/editions/$editionSlug",
  });
  const { canShowStage, canShowDay, canShowTime } = useScheduleReveal();
  const { label, icon: Icon, gradient } = getSetTypeLabel(set.set_type);
  const artistWithImage = set.artists.find((artist) => artist.image_url);

  const timeRangeFormatted = canShowTime
    ? formatTimeRange(
        set.time_start,
        set.time_end,
        use24Hour,
        festival.timezone,
      )
    : null;
  const dayOnlyFormatted =
    canShowDay && !canShowTime
      ? formatDayOnly(set.time_start, festival.timezone)
      : null;

  return (
    <div className="mb-8 space-y-6">
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
            {(timeRangeFormatted || dayOnlyFormatted) && (
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                <span className="text-sm">
                  {timeRangeFormatted || dayOnlyFormatted}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {artistWithImage?.image_url ? (
          <img
            src={artistWithImage.image_url}
            alt={artistWithImage.name}
            className="aspect-square w-full rounded-lg object-cover"
          />
        ) : (
          <SetTypePlaceholder
            setType={set.set_type}
            className="aspect-square"
          />
        )}

        <div className="lg:col-span-2 space-y-6">
          <Card className="bg-surface-raised backdrop-blur-md border">
            <CardHeader>
              <CardTitle className="text-lg">About</CardTitle>
              {set.description && (
                <CardDescription className="text-muted-foreground leading-relaxed">
                  <MarkdownText
                    content={set.description}
                    className="prose-sm prose-invert"
                  />
                </CardDescription>
              )}
            </CardHeader>
            <CardContent>
              {set.external_url && (
                <Button asChild variant="outline">
                  <a
                    href={set.external_url}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    More info
                    <ExternalLink className="h-4 w-4 ml-2" />
                  </a>
                </Button>
              )}
            </CardContent>
          </Card>

          <Card className="bg-surface-raised backdrop-blur-md border">
            <CardHeader>
              <CardTitle className="text-lg">Your vote</CardTitle>
            </CardHeader>
            <CardContent>
              <SetVotingButtons set={set} />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
