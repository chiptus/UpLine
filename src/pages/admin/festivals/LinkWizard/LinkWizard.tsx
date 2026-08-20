import { useState } from "react";
import { Loader2, LinkIcon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useArtistsMissingLinksByEditionQuery } from "@/api/artists/useArtistsMissingLinksByEdition";
import type { AdminArtistsPageSize } from "@/pages/admin/ArtistsManagement/searchSchema";
import type { Artist } from "@/api/artists/types";
import { LinkWizardStep } from "./LinkWizardStep";
import { LinkWizardTable } from "./LinkWizardTable";

interface LinkWizardProps {
  editionId: string;
}

export function LinkWizard({ editionId }: LinkWizardProps) {
  const artistsQuery = useArtistsMissingLinksByEditionQuery(editionId);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState<AdminArtistsPageSize>(10);

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
  const currentArtist = artists[Math.min(currentIndex, artists.length - 1)];

  function goTo(index: number) {
    setCurrentIndex(Math.max(0, Math.min(index, artists.length - 1)));
  }

  function handleSelectArtist(artist: Artist) {
    const index = artists.findIndex((a) => a.id === artist.id);
    if (index >= 0) goTo(index);
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <LinkIcon className="h-5 w-5" />
            Link Wizard
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
                artist={currentArtist}
                position={currentIndex + 1}
                total={artists.length}
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
            page={page}
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
