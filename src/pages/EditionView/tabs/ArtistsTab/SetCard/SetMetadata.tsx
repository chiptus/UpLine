import { Clock } from "lucide-react";
import { formatDayOnly, formatTimeRange } from "@/lib/timeUtils";
import { GenreBadge } from "@/components/GenreBadge";
import { StageBadgeForStage } from "@/components/StageBadgeForStage";
import { useFestivalSet } from "../FestivalSetContext";
import { useFestivalEdition } from "@/contexts/FestivalEditionContext";
import { useScheduleReveal } from "@/hooks/useScheduleReveal";

export function SetMetadata() {
  const { set, use24Hour } = useFestivalSet();
  const { festival } = useFestivalEdition();
  const { canShowStage, canShowDay, canShowTime } = useScheduleReveal();
  const uniqueGenres = set.artists
    ?.flatMap((a) => a.artist_music_genres || [])
    .filter(
      (genre, index, self) =>
        self.findIndex((g) => g.music_genre_id === genre.music_genre_id) ===
        index,
    );

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
    <div className="flex items-center flex-wrap gap-2">
      {/* Genres */}
      {uniqueGenres.length > 0 && (
        <div className="flex flex-wrap gap-1 items-center">
          {uniqueGenres?.map((genre) => (
            <GenreBadge
              key={genre.music_genre_id}
              genreId={genre.music_genre_id}
              size="sm"
            />
          ))}
        </div>
      )}

      {/* Stage and Time Information */}
      <div className="flex flex-wrap gap-2 items-center">
        {canShowStage && set?.stage_id && (
          <StageBadgeForStage stageId={set.stage_id} />
        )}
        {timeRangeFormatted && (
          <div className="flex items-center gap-1 text-sm text-purple-200">
            <Clock className="h-3 w-3" />
            <span>{timeRangeFormatted}</span>
          </div>
        )}
        {dayOnlyFormatted && (
          <div className="flex items-center gap-1 text-sm text-purple-200">
            <Clock className="h-3 w-3" />
            <span>{dayOnlyFormatted}</span>
          </div>
        )}
        {(timeRangeFormatted || dayOnlyFormatted) && (
          <span className="text-xs text-purple-200/60">
            {festival.timezone}
          </span>
        )}
      </div>
    </div>
  );
}
