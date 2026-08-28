import { Loader2, LinkIcon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  useArtistsMissingLinksByEditionQuery,
  useUntypedSetsByEditionQuery,
} from "@/api/artists/useArtistsMissingLinksByEdition";
import { usePrefetchNextBatchLinks } from "@/api/artistSearch/usePrefetchNextBatchLinks";
import { useLinkWizardSkipped } from "@/hooks/useLinkWizardSkipped";
import { useLinkWizardQueue } from "./useLinkWizardQueue";
import type { LinkWizardQueueItem } from "./buildLinkWizardQueue";
import { LinkWizardQueue } from "./LinkWizardQueue";
import { LinkWizardStep } from "./LinkWizardStep";
import { SetTypeBackfillStep } from "./SetTypeBackfillStep";

interface LinkWizardProps {
  editionId: string;
}

export function LinkWizard({ editionId }: LinkWizardProps) {
  const artistsQuery = useArtistsMissingLinksByEditionQuery(editionId);
  const untypedSetsQuery = useUntypedSetsByEditionQuery(editionId);
  const skippedHook = useLinkWizardSkipped(editionId);
  const allArtists = artistsQuery.data ?? [];
  const untypedSets = untypedSetsQuery.data ?? [];
  const queue = useLinkWizardQueue(allArtists, untypedSets, skippedHook);
  const { items, artists: filteredArtists, currentItem, position, total } =
    queue;

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
          items={items}
          currentItemId={currentItem?.id}
          onSelectItem={queue.selectItem}
          selectedStages={queue.selectedStages}
          onStageToggle={queue.toggleStage}
          onClearStages={queue.clearStages}
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
          {items.length === 0 ? (
            <p className="text-muted-foreground">
              {queue.selectedStages.length > 0
                ? "No artists missing links and no sets missing a type on selected stages."
                : "All artists in this edition have both links set and all sets have a type."}
            </p>
          ) : currentItem?.kind === "artist" ? (
            <LinkWizardStep
              key={currentItem.id}
              artist={currentItem.artist}
              position={position}
              total={total}
              artists={filteredArtists}
              onPrev={queue.prev}
              onNext={queue.skip}
              onSaveSuccess={queue.save}
            />
          ) : (
            currentItem && (
              <SetTypeBackfillStep
                key={currentItem.id}
                set={currentItem.set}
                position={position}
                total={total}
                onPrev={queue.prev}
                onNext={queue.skip}
                onSaveSuccess={queue.save}
              />
            )
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function itemName(item: LinkWizardQueueItem) {
  return item.kind === "artist" ? item.artist.name : item.set.name;
}
