import { Badge } from "@/components/ui/badge";
import type { ArtistSetWithCoPerformers } from "@/api/artists/useArtistsMissingLinksByEdition";

interface SetCoPerformersProps {
  coPerformers: ArtistSetWithCoPerformers["co_performers"];
  currentArtistId: string;
}

export function SetCoPerformers({
  coPerformers,
  currentArtistId,
}: SetCoPerformersProps) {
  const otherPerformers = coPerformers.filter(
    (cp) => cp.artist_id !== currentArtistId,
  );

  return (
    <div className="pt-2">
      <p className="text-xs font-medium mb-1">Co-performers:</p>
      <div className="flex flex-wrap gap-1">
        {otherPerformers.length === 0 ? (
          <span className="text-xs text-muted-foreground">
            No other co-performers
          </span>
        ) : (
          otherPerformers.map((coPerformer) => (
            <Badge
              key={coPerformer.artist_id}
              variant="secondary"
              className="text-xs"
            >
              {coPerformer.artist_name}
              {coPerformer.role && ` (${coPerformer.role})`}
            </Badge>
          ))
        )}
      </div>
    </div>
  );
}
