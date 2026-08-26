import { useState } from "react";
import { Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { useArtistsMissingLinksByEditionQuery } from "@/api/artists/useArtistsMissingLinksByEdition";
import { usePrefetchNextBatchLinks } from "@/api/artistSearch/usePrefetchNextBatchLinks";
import type { AdminArtistsPageSize } from "@/pages/admin/ArtistsManagement/searchSchema";
import type { Artist } from "@/api/artists/types";
import { PrototypeSwitcher } from "@/components/PrototypeSwitcher";
import {
  VariantStacked,
  VariantLeftRail,
  VariantSplitTable,
  type LayoutVariantProps,
} from "./LinkWizardLayoutPrototypes";

// PROTOTYPE (issue #376 Q13): layout variants switchable via ?variant=.
// Once a layout wins, inline it here and delete LinkWizardLayoutPrototypes.tsx
// and the PrototypeSwitcher usage.
export type LinkWizardLayoutVariant = "a" | "b" | "c";

const PROTOTYPE_VARIANTS = [
  { key: "a", name: "Stacked (current)" },
  { key: "b", name: "Left rail" },
  { key: "c", name: "Split table" },
];

interface LinkWizardProps {
  editionId: string;
  variant: LinkWizardLayoutVariant;
  onVariantChange: (variant: LinkWizardLayoutVariant) => void;
}

export function LinkWizard({
  editionId,
  variant,
  onVariantChange,
}: LinkWizardProps) {
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

  const variantProps: LayoutVariantProps = {
    artists,
    currentArtist,
    currentIndex,
    page: clampedPage,
    pageSize,
    onPageChange: setPage,
    onPageSizeChange: handlePageSizeChange,
    onSelectArtist: handleSelectArtist,
    onPrev: () => goTo(currentIndex - 1),
    onNext: () => goTo(currentIndex + 1),
  };

  return (
    <>
      {variant === "a" && <VariantStacked {...variantProps} />}
      {variant === "b" && <VariantLeftRail {...variantProps} />}
      {variant === "c" && <VariantSplitTable {...variantProps} />}
      <PrototypeSwitcher
        variants={PROTOTYPE_VARIANTS}
        current={variant}
        onChange={(key) => onVariantChange(key as LinkWizardLayoutVariant)}
      />
    </>
  );

  function goTo(index: number) {
    const clamped = Math.max(0, Math.min(index, artists.length - 1));
    setCurrentArtistId(artists[clamped]?.id);
  }

  function handleSelectArtist(artist: Artist) {
    setCurrentArtistId(artist.id);
  }

  function handlePageSizeChange(size: AdminArtistsPageSize) {
    setPageSize(size);
    setPage(0);
  }
}
