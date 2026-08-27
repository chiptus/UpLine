import { Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { formatDayOnly, formatTimeRange } from "@/lib/timeUtils";
import { getSetTypeLabel } from "@/lib/setTypeLabels";
import { GenreBadge } from "@/components/GenreBadge";
import { StageBadgeById } from "@/components/StageBadgeById";
import { useFestivalSet } from "../FestivalSetContext";
import { useRouteContext } from "@tanstack/react-router";
import { useScheduleReveal } from "@/hooks/useScheduleReveal";
import { useTimeFormat } from "@/hooks/useTimeFormat";

export function SetMetadata() {
  const { set } = useFestivalSet();
  const use24Hour = useTimeFormat();
  const { festival } = useRouteContext({
    from: "/festivals/$festivalSlug/editions/$editionSlug",
  });
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

  const isNonMusicSet = set.set_type !== null && set.set_type !== "music";
  const typeLabel = getSetTypeLabel(set.set_type);

  return (
    <div className="flex items-center flex-wrap gap-2">
      {isNonMusicSet && (
        <Badge variant="secondary" className="gap-1">
          <typeLabel.icon className="h-3 w-3" />
          {typeLabel.label}
        </Badge>
      )}
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
          <StageBadgeById stageId={set.stage_id} />
        )}
        {timeRangeFormatted && (
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <Clock className="h-3 w-3" />
            <span>{timeRangeFormatted}</span>
          </div>
        )}
        {dayOnlyFormatted && (
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <Clock className="h-3 w-3" />
            <span>{dayOnlyFormatted}</span>
          </div>
        )}
      </div>
    </div>
  );
}
