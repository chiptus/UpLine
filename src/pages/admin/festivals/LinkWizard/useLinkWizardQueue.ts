import { useState } from "react";
import type {
  ArtistSetWithCoPerformers,
  ArtistWithSets,
} from "@/api/artists/useArtistsMissingLinksByEdition";
import { filterArtistsByStage } from "@/lib/filterArtistsByStage";
import type { useLinkWizardSkipped } from "@/hooks/useLinkWizardSkipped";
import {
  buildLinkWizardQueue,
  type LinkWizardQueueItem,
} from "./buildLinkWizardQueue";

export function useLinkWizardQueue(
  allArtists: ArtistWithSets[],
  untypedSets: ArtistSetWithCoPerformers[],
  skippedHook: ReturnType<typeof useLinkWizardSkipped>,
) {
  const [currentItemId, setCurrentItemId] = useState<string | undefined>(
    undefined,
  );
  const [selectedStages, setSelectedStages] = useState<string[]>([]);

  const unskippedArtists = allArtists.filter(
    (artist) => !skippedHook.isSkipped(artist.id),
  );
  const artists = filterArtistsByStage(unskippedArtists, selectedStages);
  const items = buildLinkWizardQueue(artists, untypedSets, selectedStages);

  const currentIndex = currentItemId
    ? Math.max(
        0,
        items.findIndex((item) => item.id === currentItemId),
      )
    : 0;
  const currentItem = items[Math.min(currentIndex, items.length - 1)];

  return {
    items,
    artists,
    currentItem,
    position: items.length === 0 ? 0 : currentIndex + 1,
    total: items.length,
    prev,
    skip,
    save,
    selectItem,
    selectedStages,
    toggleStage,
    clearStages,
  };

  function goTo(index: number) {
    const clamped = Math.max(0, Math.min(index, items.length - 1));
    setCurrentItemId(items[clamped]?.id);
  }

  function nextIndexAfterRemoval() {
    const isLast = currentIndex >= items.length - 1;
    return isLast ? currentIndex - 1 : currentIndex + 1;
  }

  function prev() {
    goTo(currentIndex - 1);
  }

  // Artist items are removed from the queue once skipped/saved, so advancing
  // treats the current position as vacated. Set items aren't tracked in
  // skippedHook and only leave the queue once a refetch confirms they're
  // typed, so skipping one is a plain advance (nothing to mark, nothing
  // removed yet) — see buildLinkWizardQueue.ts.
  function skip() {
    if (!currentItem) return;
    if (currentItem.kind === "artist") {
      skippedHook.markSkipped(currentItem.id);
      goTo(nextIndexAfterRemoval());
    } else {
      goTo(currentIndex + 1);
    }
  }

  function save() {
    if (!currentItem) return;
    if (currentItem.kind === "artist") {
      skippedHook.markSaved(currentItem.id);
    }
    goTo(nextIndexAfterRemoval());
  }

  function selectItem(item: LinkWizardQueueItem) {
    setCurrentItemId(item.id);
  }

  function toggleStage(stageId: string) {
    setSelectedStages((prev) =>
      prev.includes(stageId)
        ? prev.filter((id) => id !== stageId)
        : [...prev, stageId],
    );
  }

  function clearStages() {
    setSelectedStages([]);
  }
}
