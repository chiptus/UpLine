import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ArtistWithSets } from "@/api/artists/useArtistsMissingLinksByEdition";
import { ArtistSetCard } from "./ArtistSetCard";

interface ArtistSetInfoPanelProps {
  artist: ArtistWithSets;
  timezone: string;
}

export function ArtistSetInfoPanel({
  artist,
  timezone,
}: ArtistSetInfoPanelProps) {
  const sets = artist.sets;

  if (sets.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">
          {artist.name} - Festival Set{sets.length !== 1 ? "s" : ""}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {sets.map((set) => (
          <ArtistSetCard
            key={set.id}
            set={set}
            timezone={timezone}
            currentArtistId={artist.id}
          />
        ))}
      </CardContent>
    </Card>
  );
}
