import type { ArtistSetWithCoPerformers } from "@/api/artists/useArtistsMissingLinksByEdition";
import { formatTimeOnly } from "@/lib/timeUtils";
import { SetCoPerformers } from "./SetCoPerformers";

interface ArtistSetCardProps {
  set: ArtistSetWithCoPerformers;
  currentArtistId: string;
}

export function ArtistSetCard({ set, currentArtistId }: ArtistSetCardProps) {
  const time = formatTimeOnly(set.time_start, set.time_end, true);

  return (
    <div className="border-l-2 border-primary pl-4 py-2">
      <div className="space-y-2">
        <div>
          <h4 className="font-semibold text-sm">{set.name}</h4>
          {set.stage_name && (
            <p className="text-xs text-paper-muted-foreground">
              Stage: {set.stage_name}
            </p>
          )}
        </div>

        {time && (
          <div className="text-xs text-paper-muted-foreground">{time}</div>
        )}

        {set.description && (
          <p className="text-xs text-paper-muted-foreground">
            {set.description}
          </p>
        )}

        {set.co_performers.length > 0 && (
          <SetCoPerformers
            coPerformers={set.co_performers}
            currentArtistId={currentArtistId}
          />
        )}
      </div>
    </div>
  );
}
