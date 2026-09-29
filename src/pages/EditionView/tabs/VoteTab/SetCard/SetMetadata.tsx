import { Clock } from "lucide-react";
import { GenreBadge } from "@/components/GenreBadge";
import { StageBadgeById } from "@/components/StageBadgeById";
import { useFestivalSet } from "../FestivalSetContext";
import { useScheduleReveal } from "@/hooks/useScheduleReveal";
import { useTimeFormat } from "@/hooks/useTimeFormat";

export function SetMetadata() {
  const { set } = useFestivalSet();
  const use24Hour = useTimeFormat();
  const { revealLabels } = useScheduleReveal();
  const uniqueGenres = set.artists
    ?.flatMap((a) => a.artist_music_genres || [])
    .filter(
      (genre, index, self) =>
        self.findIndex((g) => g.music_genre_id === genre.music_genre_id) ===
        index,
    );

  const { dayLabel, timeLabel, stageId } = revealLabels(set, use24Hour);
  const scheduleFormatted = dayLabel ?? timeLabel;

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
        {stageId && <StageBadgeById stageId={stageId} />}
        {scheduleFormatted && (
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <Clock className="h-3 w-3" />
            <span>{scheduleFormatted}</span>
          </div>
        )}
      </div>
    </div>
  );
}
