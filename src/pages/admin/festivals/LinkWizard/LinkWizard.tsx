import { useState } from "react";
import { Loader2, LinkIcon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  useArtistsMissingLinksByEditionQuery,
  type ArtistWithSets,
} from "@/api/artists/useArtistsMissingLinksByEdition";
import { usePrefetchNextBatchLinks } from "@/api/artistSearch/usePrefetchNextBatchLinks";
import { LinkWizardQueue } from "./LinkWizardQueue";
import { LinkWizardStep } from "./LinkWizardStep";

interface LinkWizardProps {
  editionId: string;
}

export function LinkWizard({ editionId }: LinkWizardProps) {
  const artistsQuery = useArtistsMissingLinksByEditionQuery(editionId);
  const [currentArtistId, setCurrentArtistId] = useState<string | undefined>(
    undefined,
  );

  const artists = artistsQuery.data ?? [];
  const currentIndex = currentArtistId
    ? Math.max(
        0,
        artists.findIndex((artist) => artist.id === currentArtistId),
      )
    : 0;
  const currentArtist = artists[Math.min(currentIndex, artists.length - 1)];

  usePrefetchNextBatchLinks(artists, currentArtist?.id);

  if (artistsQuery.isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-8">
          <Loader2 className="h-6 w-6 animate-spin mr-2" />
          <span>Loading artists...</span>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[280px_minmax(0,1fr)] gap-6 items-start">
      <LinkWizardQueue
        artists={artists}
        currentArtistId={currentArtist?.id}
        onSelectArtist={handleSelectArtist}
      />
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <LinkIcon className="h-5 w-5" />
            Link Wizard{currentArtist && ` - ${currentArtist.name}`}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {artists.length === 0 ? (
            <p className="text-muted-foreground">
              All artists in this edition have both links set.
            </p>
          ) : (
            currentArtist && (
              <LinkWizardStep
                key={currentArtist.id}
                artist={currentArtist}
                position={currentIndex + 1}
                total={artists.length}
                artists={artists}
                onPrev={() => goTo(currentIndex - 1)}
                onNext={() => goTo(currentIndex + 1)}
              />
            )
          )}
        </CardContent>
      </Card>
    </div>
  );

  function goTo(index: number) {
    const clamped = Math.max(0, Math.min(index, artists.length - 1));
    setCurrentArtistId(artists[clamped]?.id);
  }

  function handleSelectArtist(artist: ArtistWithSets) {
    setCurrentArtistId(artist.id);
  }
}
