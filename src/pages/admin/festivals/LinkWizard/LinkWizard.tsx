import { useState } from "react";
import { Loader2, LinkIcon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  useArtistsMissingLinksByEditionQuery,
  useUntypedSetsByEditionQuery,
} from "@/api/artists/useArtistsMissingLinksByEdition";
import { usePrefetchNextBatchLinks } from "@/api/artistSearch/usePrefetchNextBatchLinks";
import { useIsMobile } from "@/hooks/use-mobile";
import { filterArtistsByStage } from "@/lib/filterArtistsByStage";
import { useLinkWizardSkipped } from "@/hooks/useLinkWizardSkipped";
import {
  buildLinkWizardQueue,
  type LinkWizardQueueItem,
} from "./buildLinkWizardQueue";
import { LinkWizardQueue } from "./LinkWizardQueue";
import { LinkWizardStep } from "./LinkWizardStep";
import { SetTypeBackfillStep } from "./SetTypeBackfillStep";

interface LinkWizardProps {
  editionId: string;
}

export function LinkWizard({ editionId }: LinkWizardProps) {
  const isMobile = useIsMobile();
  const artistsQuery = useArtistsMissingLinksByEditionQuery(editionId);
  const untypedSetsQuery = useUntypedSetsByEditionQuery(editionId);
  const [currentItemId, setCurrentItemId] = useState<string | undefined>(
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

  const queueItems = buildLinkWizardQueue(
    filteredArtists,
    untypedSetsQuery.data ?? [],
    selectedStages,
  );

  const currentIndex = currentItemId
    ? Math.max(
        0,
        queueItems.findIndex((item) => item.id === currentItemId),
      )
    : 0;
  const currentItem = queueItems[Math.min(currentIndex, queueItems.length - 1)];

  usePrefetchNextBatchLinks(
    filteredArtists,
    currentItem?.kind === "artist" ? currentItem.id : undefined,
  );

  if (artistsQuery.isLoading || untypedSetsQuery.isLoading) {
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
          items={queueItems}
          currentItemId={currentItem?.id}
          onSelectItem={handleSelectItem}
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
            Link Wizard{currentItem && ` - ${itemName(currentItem)}`}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {queueItems.length === 0 ? (
            <p className="text-muted-foreground">
              {selectedStages.length > 0
                ? "No artists missing links and no sets missing a type on selected stages."
                : "All artists in this edition have both links set and all sets have a type."}
            </p>
          ) : currentItem?.kind === "artist" ? (
            <LinkWizardStep
              key={currentItem.id}
              artist={currentItem.artist}
              position={currentIndex + 1}
              total={queueItems.length}
              artists={filteredArtists}
              onPrev={() => goTo(currentIndex - 1)}
              onNext={() => {
                skippedHook.markSkipped(currentItem.id);
                goTo(nextIndexAfterRemoval());
              }}
              onSaveSuccess={() => {
                skippedHook.markSaved(currentItem.id);
                goTo(nextIndexAfterRemoval());
              }}
            />
          ) : (
            currentItem && (
              <SetTypeBackfillStep
                key={currentItem.id}
                set={currentItem.set}
                position={currentIndex + 1}
                total={queueItems.length}
                onPrev={() => goTo(currentIndex - 1)}
                onNext={() => goTo(currentIndex + 1)}
                onSaveSuccess={() => goTo(nextIndexAfterRemoval())}
              />
            )
          )}
        </CardContent>
      </Card>
    </div>
  );

  function goTo(index: number) {
    const clamped = Math.max(0, Math.min(index, queueItems.length - 1));
    setCurrentItemId(queueItems[clamped]?.id);
  }

  function nextIndexAfterRemoval() {
    const isLast = currentIndex >= queueItems.length - 1;
    return isLast ? currentIndex - 1 : currentIndex + 1;
  }

  function handleSelectItem(item: LinkWizardQueueItem) {
    setCurrentItemId(item.id);
  }

  function handleStageToggle(stageId: string) {
    setSelectedStages((prev) =>
      prev.includes(stageId)
        ? prev.filter((id) => id !== stageId)
        : [...prev, stageId],
    );
  }
}

function itemName(item: LinkWizardQueueItem) {
  return item.kind === "artist" ? item.artist.name : item.set.name;
}
