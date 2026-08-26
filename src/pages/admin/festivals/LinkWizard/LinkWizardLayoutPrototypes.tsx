// PROTOTYPE ONLY — throwaway layout variants for issue #376 Q13
// ("maybe move artist list to the left side on desktop").
// Three variants of the Link Wizard desktop layout, switchable via ?variant=
// on the existing links route. Delete the losers (and this file) once a
// variant wins; fold the winner into LinkWizard.tsx.

import { LinkIcon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { AdminArtistsPageSize } from "@/pages/admin/ArtistsManagement/searchSchema";
import type { Artist } from "@/api/artists/types";
import type { ArtistWithSets } from "@/api/artists/useArtistsMissingLinksByEdition";
import { cn } from "@/lib/utils";
import { LinkWizardStep } from "./LinkWizardStep";
import { LinkWizardTable } from "./LinkWizardTable";

export interface LayoutVariantProps {
  artists: ArtistWithSets[];
  currentArtist: ArtistWithSets | undefined;
  currentIndex: number;
  page: number;
  pageSize: AdminArtistsPageSize;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: AdminArtistsPageSize) => void;
  onSelectArtist: (artist: Artist) => void;
  onPrev: () => void;
  onNext: () => void;
}

function StepCard({
  artists,
  currentArtist,
  currentIndex,
  onPrev,
  onNext,
}: LayoutVariantProps) {
  return (
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
              onPrev={onPrev}
              onNext={onNext}
            />
          )
        )}
      </CardContent>
    </Card>
  );
}

/** Variant A — current layout: step card on top, paginated table below. */
export function VariantStacked(props: LayoutVariantProps) {
  const {
    artists,
    currentArtist,
    page,
    pageSize,
    onPageChange,
    onPageSizeChange,
    onSelectArtist,
  } = props;
  return (
    <div className="space-y-6">
      <StepCard {...props} />
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
            onPageChange={onPageChange}
            onPageSizeChange={onPageSizeChange}
            onSelectArtist={onSelectArtist}
          />
        </CardContent>
      </Card>
    </div>
  );
}

/**
 * Variant B — narrow left rail: the whole queue as one compact scrollable
 * list (no pagination), sticky beside the step card. Step card keeps most
 * of the width.
 */
export function VariantLeftRail(props: LayoutVariantProps) {
  const { artists, currentArtist, onSelectArtist } = props;
  return (
    <div className="grid grid-cols-1 lg:grid-cols-[280px_minmax(0,1fr)] gap-6 items-start">
      <Card className="lg:sticky lg:top-4 order-last lg:order-first">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Queue ({artists.length})</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <ScrollArea className="h-[70vh]">
            <ul className="pb-2">
              {artists.length === 0 && (
                <li className="px-4 py-3 text-sm text-muted-foreground">
                  No artists missing links.
                </li>
              )}
              {artists.map((artist) => (
                <li key={artist.id}>
                  <button
                    type="button"
                    onClick={() => onSelectArtist(artist)}
                    className={cn(
                      "w-full text-left px-4 py-2 hover:bg-accent/40 flex items-center justify-between gap-2",
                      artist.id === currentArtist?.id &&
                        "bg-accent/20 border-l-2 border-primary",
                    )}
                  >
                    <span className="truncate text-sm">{artist.name}</span>
                    <span className="flex gap-1 shrink-0">
                      {!artist.spotify_url && (
                        <span
                          className="h-2 w-2 rounded-full bg-green-500"
                          title="Missing Spotify"
                        />
                      )}
                      {!artist.soundcloud_url && (
                        <span
                          className="h-2 w-2 rounded-full bg-orange-500"
                          title="Missing SoundCloud"
                        />
                      )}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </ScrollArea>
        </CardContent>
      </Card>
      <StepCard {...props} />
    </div>
  );
}

/**
 * Variant C — split panel: the existing paginated table moves to a wide
 * left panel (~40%), step card on the right.
 */
export function VariantSplitTable(props: LayoutVariantProps) {
  const {
    artists,
    currentArtist,
    page,
    pageSize,
    onPageChange,
    onPageSizeChange,
    onSelectArtist,
  } = props;
  return (
    <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] gap-6 items-start">
      <Card className="order-last lg:order-first">
        <CardHeader>
          <CardTitle>Remaining Artists</CardTitle>
        </CardHeader>
        <CardContent>
          <LinkWizardTable
            artists={artists}
            currentArtistId={currentArtist?.id}
            page={page}
            pageSize={pageSize}
            onPageChange={onPageChange}
            onPageSizeChange={onPageSizeChange}
            onSelectArtist={onSelectArtist}
          />
        </CardContent>
      </Card>
      <StepCard {...props} />
    </div>
  );
}
