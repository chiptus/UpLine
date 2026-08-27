import { useState } from "react";
import { Loader2, LinkIcon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  useArtistsMissingLinksByEditionQuery,
  type ArtistWithSets,
} from "@/api/artists/useArtistsMissingLinksByEdition";
import { usePrefetchNextBatchLinks } from "@/api/artistSearch/usePrefetchNextBatchLinks";
import { useIsMobile } from "@/hooks/use-mobile";
import { filterArtistsByStage } from "@/lib/filterArtistsByStage";
import { useLinkWizardSkipped } from "@/hooks/useLinkWizardSkipped";
import { LinkWizardQueue } from "./LinkWizardQueue";
import { LinkWizardStep } from "./LinkWizardStep";

interface LinkWizardProps {
  editionId: string;
}

export function LinkWizard({ editionId }: LinkWizardProps) {
  const isMobile = useIsMobile();
  const artistsQuery = useArtistsMissingLinksByEditionQuery(editionId);
  const [currentArtistId, setCurrentArtistId] = useState<string | undefined>(
    undefined,
  );
  const [selectedStages, setSelectedStages] = useState<string[]>([]);
  const [showFullQueue, setShowFullQueue] = useState(false);
  const skippedHook = useLinkWizardSkipped(editionId);

  const allArtists = artistsQuery.data ?? [];
  const unskippedArtists = allArtists.filter(
    (artist) => !skippedHook.isSkipped(artist.id),
  );
  const filteredArtists = filterArtistsByStage(
    unskippedArtists,
    selectedStages,
  );

  const currentIndex = currentArtistId
    ? Math.max(
        0,
        filteredArtists.findIndex((artist) => artist.id === currentArtistId),
      )
    : 0;
  const currentArtist =
    filteredArtists[Math.min(currentIndex, filteredArtists.length - 1)];

  usePrefetchNextBatchLinks(filteredArtists, currentArtist?.id);

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
    <div className="space-y-6 lg:grid lg:grid-cols-[280px_minmax(0,1fr)] lg:gap-6 lg:items-start">
      <div className="lg:sticky lg:top-4">
        <LinkWizardQueue
          artists={filteredArtists}
          currentArtistId={currentArtist?.id}
          onSelectArtist={handleSelectArtist}
          selectedStages={selectedStages}
          onStageToggle={handleStageToggle}
          onClearStages={() => setSelectedStages([])}
          isPreviewMode={isMobile && !showFullQueue}
          onViewAll={() => setShowFullQueue(true)}
          skippedArtists={skippedHook.getSkippedArtists()}
          allArtists={allArtists}
          onRestoreSkipped={skippedHook.restore}
          onClearAllSkipped={skippedHook.clearAll}
        />
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <LinkIcon className="h-5 w-5" />
            Link Wizard{currentArtist && ` - ${currentArtist.name}`}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredArtists.length === 0 ? (
            <p className="text-muted-foreground">
              {selectedStages.length > 0
                ? "No artists missing links on selected stages."
                : "All artists in this edition have both links set."}
            </p>
          ) : (
            currentArtist && (
              <LinkWizardStep
                key={currentArtist.id}
                artist={currentArtist}
                position={currentIndex + 1}
                total={filteredArtists.length}
                artists={filteredArtists}
                onPrev={() => goTo(currentIndex - 1)}
                onNext={() => {
                  skippedHook.markSkipped(currentArtist.id);
                  goTo(nextIndexAfterRemoval());
                }}
                onSaveSuccess={() => {
                  skippedHook.markSaved(currentArtist.id);
                  goTo(nextIndexAfterRemoval());
                }}
              />
            )
          )}
        </CardContent>
      </Card>
    </div>
  );

  function goTo(index: number) {
    const clamped = Math.max(0, Math.min(index, filteredArtists.length - 1));
    setCurrentArtistId(filteredArtists[clamped]?.id);
  }

  function nextIndexAfterRemoval() {
    const isLast = currentIndex >= filteredArtists.length - 1;
    return isLast ? currentIndex - 1 : currentIndex + 1;
  }

  function handleSelectArtist(artist: ArtistWithSets) {
    setCurrentArtistId(artist.id);
  }

  function handleStageToggle(stageId: string) {
    setSelectedStages((prev) =>
      prev.includes(stageId)
        ? prev.filter((id) => id !== stageId)
        : [...prev, stageId],
    );
  }
}
