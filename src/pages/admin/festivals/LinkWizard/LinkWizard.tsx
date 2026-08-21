import { useState } from "react";
import { Loader2, LinkIcon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useArtistsMissingLinksByEditionQuery } from "@/api/artists/useArtistsMissingLinksByEdition";
import { usePrefetchNextBatchLinks } from "@/api/artistSearch/usePrefetchNextBatchLinks";
import type { AdminArtistsPageSize } from "@/pages/admin/ArtistsManagement/searchSchema";
import type { Artist } from "@/api/artists/types";
import { LinkWizardStep } from "./LinkWizardStep";
import { LinkWizardTable } from "./LinkWizardTable";

interface LinkWizardProps {
  editionId: string;
}

export function LinkWizard({ editionId }: LinkWizardProps) {
  const artistsQuery = useArtistsMissingLinksByEditionQuery(editionId);
  const [currentArtistId, setCurrentArtistId] = useState<string | undefined>(
    undefined,
  );
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState<AdminArtistsPageSize>(10);

  usePrefetchNextBatchLinks(artistsQuery.data ?? [], currentArtistId);

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

  const artists = artistsQuery.data ?? [];
  const currentIndex = currentArtistId
    ? Math.max(
        0,
        artists.findIndex((artist) => artist.id === currentArtistId),
      )
    : 0;
  const currentArtist = artists[Math.min(currentIndex, artists.length - 1)];
  const pageCount = Math.max(1, Math.ceil(artists.length / pageSize));
  const clampedPage = Math.min(page, pageCount - 1);

  function goTo(index: number) {
    const clamped = Math.max(0, Math.min(index, artists.length - 1));
    setCurrentArtistId(artists[clamped]?.id);
  }

  function handleSelectArtist(artist: Artist) {
    setCurrentArtistId(artist.id);
  }

  return (
    <div className="space-y-6">
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

      <Card>
        <CardHeader>
          <CardTitle>Remaining Artists</CardTitle>
        </CardHeader>
        <CardContent>
          <LinkWizardTable
            artists={artists}
            currentArtistId={currentArtist?.id}
            page={clampedPage}
            pageSize={pageSize}
            onPageChange={setPage}
            onPageSizeChange={(size) => {
              setPageSize(size);
              setPage(0);
            }}
            onSelectArtist={handleSelectArtist}
          />
        </CardContent>
      </Card>
    </div>
  );
}
