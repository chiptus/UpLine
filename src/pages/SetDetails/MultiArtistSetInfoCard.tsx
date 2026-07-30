import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, Users } from "lucide-react";
import { SetVotingButtons } from "./SetVotingButtons";
import { FestivalSet } from "@/api/sets/types";
import { formatDayOnly, formatTimeRange } from "@/lib/timeUtils";
import { GenreBadge } from "@/components/GenreBadge";
import { IndividualArtistCard } from "./IndividualArtistCard";
import { StagePin } from "@/components/StagePin";
import { MarkdownText } from "@/components/ui/markdown-text";
import { useScheduleReveal } from "@/hooks/useScheduleReveal";
import { useFestivalEdition } from "@/contexts/FestivalEditionContext";
import { FestivalTimeHint } from "@/components/FestivalTimeHint";

interface MultiArtistSetInfoCardProps {
  set: FestivalSet;
  netVoteScore: number;
  use24Hour?: boolean;
}

export function MultiArtistSetInfoCard({
  set,
  netVoteScore,
  use24Hour = false,
}: MultiArtistSetInfoCardProps) {
  const allGenres = set.artists.flatMap(
    (artist) => artist.artist_music_genres || [],
  );
  const uniqueGenres = allGenres.filter(
    (genre, index, self) =>
      index ===
      self.findIndex((g) => g.music_genre_id === genre.music_genre_id),
  );
  const { festival, edition } = useFestivalEdition();
  const { canShowStage, canShowDay, canShowTime } = useScheduleReveal();
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
    <div className="lg:col-span-2 space-y-6">
      {/* Main Set Info Card */}
      <Card className="bg-white/10 backdrop-blur-md border-purple-400/30">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <CardTitle className="text-3xl font-bold text-white mb-2">
                {set.name}
              </CardTitle>

              {/* Set Summary */}
              <div className="mb-4">
                <div className="flex items-center gap-2 mb-2">
                  <Users className="h-4 w-4 text-purple-200" />
                  <span className="text-sm text-purple-200 font-medium">
                    {set.artists.length} Artists
                  </span>
                </div>
              </div>

              {/* Genres */}
              <div className="flex flex-wrap gap-2 mb-4">
                {uniqueGenres.map((genre) => (
                  <GenreBadge
                    key={genre.music_genre_id}
                    genreId={genre.music_genre_id}
                  />
                ))}
                {netVoteScore !== 0 && (
                  <Badge
                    variant="outline"
                    className={`${
                      netVoteScore > 0
                        ? "border-green-400 text-green-400"
                        : "border-red-400 text-red-400"
                    }`}
                  >
                    Score: {netVoteScore > 0 ? "+" : ""}
                    {netVoteScore}
                  </Badge>
                )}
              </div>

              {/* Performance Information */}
              <div className="flex flex-wrap gap-4 mb-4 text-purple-200">
                {canShowStage && edition && (
                  <StagePin stageId={set.stage_id} editionId={edition.id} />
                )}
                {timeRangeFormatted && (
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    <span className="text-sm">{timeRangeFormatted}</span>
                  </div>
                )}
                {dayOnlyFormatted && (
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    <span className="text-sm">{dayOnlyFormatted}</span>
                  </div>
                )}
                {(timeRangeFormatted || dayOnlyFormatted) && (
                  <FestivalTimeHint timezone={festival.timezone} />
                )}
              </div>
            </div>
          </div>
          {set.description && (
            <CardDescription className="text-purple-200 text-lg leading-relaxed">
              <MarkdownText
                content={set.description}
                className="prose-sm prose-invert"
              />
            </CardDescription>
          )}
        </CardHeader>
        <CardContent>
          <SetVotingButtons set={set} />
        </CardContent>
      </Card>

      {/* Individual Artist Cards */}
      <div>
        <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
          <Users className="h-5 w-5" />
          Artists in this Set
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {set.artists.map((artist) => (
            <IndividualArtistCard
              key={artist.id}
              artist={artist}
              showFullDetails={false}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
