// PROTOTYPE — throwaway, answers: "should the desktop Remaining Artists list move to the left?" (issue #376)
// Not wired into any route. Not for production use.
import { useEffect, useState } from "react";
import { Loader2, LinkIcon, ChevronLeft, ChevronRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useArtistsMissingLinksByEditionQuery } from "@/api/artists/useArtistsMissingLinksByEdition";
import { usePrefetchNextBatchLinks } from "@/api/artistSearch/usePrefetchNextBatchLinks";
import type { AdminArtistsPageSize } from "@/pages/admin/ArtistsManagement/searchSchema";
import type { Artist } from "@/api/artists/types";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { LinkWizardStep } from "./LinkWizardStep";
import { LinkWizardTable } from "./LinkWizardTable";

const VARIANTS = ["A", "B", "C"] as const;
type Variant = (typeof VARIANTS)[number];
const VARIANT_LABELS: Record<Variant, string> = {
  A: "Current (stacked)",
  B: "Left sidebar list",
  C: "Compact left rail",
};

interface LinkWizardProps {
  editionId: string;
}

export function LinkWizardPrototypeLayout({ editionId }: LinkWizardProps) {
  const artistsQuery = useArtistsMissingLinksByEditionQuery(editionId);
  const [currentArtistId, setCurrentArtistId] = useState<string | undefined>(
    undefined,
  );
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState<AdminArtistsPageSize>(10);
  const [variant, setVariant] = useState<Variant>(
    () =>
      (new URLSearchParams(window.location.search).get("variant") as Variant) ||
      "A",
  );

  usePrefetchNextBatchLinks(artistsQuery.data ?? [], currentArtistId);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
      if (e.key === "ArrowLeft") cycle(-1);
      if (e.key === "ArrowRight") cycle(1);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [variant]);

  function cycle(dir: 1 | -1) {
    const idx = VARIANTS.indexOf(variant);
    const next = VARIANTS[(idx + dir + VARIANTS.length) % VARIANTS.length];
    setVariant(next);
    const url = new URL(window.location.href);
    url.searchParams.set("variant", next);
    window.history.replaceState(null, "", url);
  }

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

  const stepCard =
    artists.length === 0 ? (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <LinkIcon className="h-5 w-5" />
            Link Wizard
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            All artists in this edition have both links set.
          </p>
        </CardContent>
      </Card>
    ) : (
      currentArtist && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <LinkIcon className="h-5 w-5" />
              Link Wizard - {currentArtist.name}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <LinkWizardStep
              key={currentArtist.id}
              artist={currentArtist}
              position={currentIndex + 1}
              total={artists.length}
              artists={artists}
              onPrev={() => goTo(currentIndex - 1)}
              onNext={() => goTo(currentIndex + 1)}
            />
          </CardContent>
        </Card>
      )
    );

  const tableProps = {
    artists,
    currentArtistId: currentArtist?.id,
    page: clampedPage,
    pageSize,
    onPageChange: setPage,
    onPageSizeChange: (size: AdminArtistsPageSize) => {
      setPageSize(size);
      setPage(0);
    },
    onSelectArtist: handleSelectArtist,
  };

  return (
    <>
      {variant === "A" && (
        <div className="space-y-6">
          {stepCard}
          <Card>
            <CardHeader>
              <CardTitle>Remaining Artists</CardTitle>
            </CardHeader>
            <CardContent>
              <LinkWizardTable {...tableProps} />
            </CardContent>
          </Card>
        </div>
      )}

      {variant === "B" && (
        <div className="grid grid-cols-1 lg:grid-cols-[360px_1fr] gap-6 items-start">
          <Card className="lg:sticky lg:top-4">
            <CardHeader>
              <CardTitle>Remaining Artists</CardTitle>
            </CardHeader>
            <CardContent>
              <LinkWizardTable {...tableProps} />
            </CardContent>
          </Card>
          {stepCard}
        </div>
      )}

      {variant === "C" && (
        <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-6 items-start">
          <div className="lg:sticky lg:top-4 space-y-2">
            <p className="text-sm font-medium text-muted-foreground px-1">
              Remaining ({artists.length})
            </p>
            <div className="border rounded-md divide-y max-h-[70vh] overflow-y-auto">
              {artists.map((artist) => (
                <button
                  key={artist.id}
                  type="button"
                  onClick={() => handleSelectArtist(artist)}
                  className={cn(
                    "w-full text-left px-3 py-2 text-sm hover:bg-accent/40 flex items-center justify-between gap-2",
                    artist.id === currentArtist?.id &&
                      "bg-accent/30 font-medium",
                  )}
                >
                  <span className="truncate">{artist.name}</span>
                  <span className="flex gap-1 shrink-0">
                    {!artist.spotify_url && (
                      <Badge variant="outline" className="text-[10px] px-1">
                        S
                      </Badge>
                    )}
                    {!artist.soundcloud_url && (
                      <Badge variant="outline" className="text-[10px] px-1">
                        SC
                      </Badge>
                    )}
                  </span>
                </button>
              ))}
            </div>
          </div>
          {stepCard}
        </div>
      )}

      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 rounded-full border bg-background shadow-lg px-2 py-1.5">
        <button
          type="button"
          onClick={() => cycle(-1)}
          className="p-1.5 rounded-full hover:bg-accent"
          aria-label="Previous variant"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <span className="text-xs font-medium px-1 min-w-[10rem] text-center">
          {variant} — {VARIANT_LABELS[variant]}
        </span>
        <button
          type="button"
          onClick={() => cycle(1)}
          className="p-1.5 rounded-full hover:bg-accent"
          aria-label="Next variant"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </>
  );
}
