import type { ArtistSetWithCoPerformers } from "@/api/artists/useArtistsMissingLinksByEdition";
import { SetCoPerformers } from "./SetCoPerformers";

interface ArtistSetCardProps {
  set: ArtistSetWithCoPerformers;
  currentArtistId: string;
}

export function ArtistSetCard({ set, currentArtistId }: ArtistSetCardProps) {
  return (
    <div className="border-l-2 border-primary pl-4 py-2">
      <div className="space-y-2">
        <div>
          <h4 className="font-semibold text-sm">{set.name}</h4>
          {set.stage_name && (
            <p className="text-xs text-muted-foreground">
              Stage: {set.stage_name}
            </p>
          )}
        </div>

        {set.time_start && (
          <div className="text-xs text-muted-foreground">
            <span>{formatSetTime(set.time_start)}</span>
            {set.time_end && (
              <>
                <span> - </span>
                <span>{formatSetTime(set.time_end)}</span>
              </>
            )}
          </div>
        )}

        {set.description && (
          <p className="text-xs text-muted-foreground">{set.description}</p>
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

function formatSetTime(time: string): string {
  return new Date(time).toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}
