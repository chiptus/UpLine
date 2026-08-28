import { Tag } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import type { ArtistWithSets } from "@/api/artists/useArtistsMissingLinksByEdition";
import type { ArtistSkipRecord } from "@/hooks/useLinkWizardSkipped";
import { cn } from "@/lib/utils";
import type { LinkWizardQueueItem } from "./buildLinkWizardQueue";
import { LinkWizardStageFilterDropdown } from "./LinkWizardStageFilterDropdown";
import { LinkWizardFilterSheet } from "./LinkWizardFilterSheet";
import { SkippedArtistsPopover } from "./SkippedArtistsPopover";

const MOBILE_PREVIEW_COUNT = 4;

interface LinkWizardQueueProps {
  items: LinkWizardQueueItem[];
  currentItemId: string | undefined;
  onSelectItem: (item: LinkWizardQueueItem) => void;
  selectedStages: string[];
  onStageToggle: (stageId: string) => void;
  onClearStages: () => void;
  isPreviewMode?: boolean;
  onViewAll?: () => void;
  skippedArtists: ArtistSkipRecord[];
  allArtists: Array<{ id: string; name: string }>;
  onRestoreSkipped: (artistId: string) => void;
  onClearAllSkipped: () => void;
}

export function LinkWizardQueue({
  items,
  currentItemId,
  onSelectItem,
  selectedStages,
  onStageToggle,
  onClearStages,
  isPreviewMode = false,
  onViewAll,
  skippedArtists,
  allArtists,
  onRestoreSkipped,
  onClearAllSkipped,
}: LinkWizardQueueProps) {
  const displayedItems = isPreviewMode
    ? items.slice(0, MOBILE_PREVIEW_COUNT)
    : items;
  const hasMoreItems = isPreviewMode && items.length > MOBILE_PREVIEW_COUNT;

  const list = (
    <ul className="pb-2">
      {displayedItems.length === 0 && (
        <li className="px-4 py-3 text-sm text-muted-foreground">
          {items.length === 0
            ? "No artists missing links and no sets missing a type."
            : "No items matching filter."}
        </li>
      )}
      {displayedItems.map((item) => (
        <LinkWizardQueueRow
          key={item.id}
          item={item}
          isCurrent={item.id === currentItemId}
          onSelect={onSelectItem}
        />
      ))}
    </ul>
  );

  return (
    <Card>
      <CardHeader className="pb-3 space-y-3">
        <CardTitle className="text-base">Queue ({items.length})</CardTitle>
        <div className="flex items-center gap-2 flex-wrap">
          <SkippedArtistsPopover
            skippedArtists={skippedArtists}
            artists={allArtists}
            onRestore={onRestoreSkipped}
            onClearAll={onClearAllSkipped}
          />
          <div className="hidden lg:block">
            <LinkWizardStageFilterDropdown
              selectedStages={selectedStages}
              onStageToggle={onStageToggle}
              onClearStages={onClearStages}
            />
          </div>
          <div className="lg:hidden">
            <LinkWizardFilterSheet
              selectedStages={selectedStages}
              onStageToggle={onStageToggle}
              onClearStages={onClearStages}
            />
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {isPreviewMode ? (
          <div>
            {list}
            {hasMoreItems && (
              <div className="px-4 py-2 border-t">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="w-full text-xs text-accent hover:text-accent hover:bg-accent-soft"
                  onClick={onViewAll}
                >
                  View all ({items.length - MOBILE_PREVIEW_COUNT} more)
                </Button>
              </div>
            )}
          </div>
        ) : (
          <ScrollArea className="h-[70vh]">{list}</ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}

interface LinkWizardQueueRowProps {
  item: LinkWizardQueueItem;
  isCurrent: boolean;
  onSelect: (item: LinkWizardQueueItem) => void;
}

function LinkWizardQueueRow({
  item,
  isCurrent,
  onSelect,
}: LinkWizardQueueRowProps) {
  return (
    <li>
      <button
        type="button"
        onClick={() => onSelect(item)}
        aria-current={isCurrent}
        className={cn(
          "w-full text-left px-4 py-2 hover:bg-accent/40 flex items-center justify-between gap-2 border-l-2 border-transparent",
          isCurrent && "bg-accent/20 border-primary",
        )}
      >
        <span className="truncate text-sm">
          {item.kind === "artist" ? item.artist.name : item.set.name}
        </span>
        {item.kind === "artist" ? (
          <MissingLinkDots artist={item.artist} />
        ) : (
          <span
            className="flex items-center gap-1 shrink-0 text-xs text-muted-foreground"
            title="Missing set type"
          >
            <Tag className="h-3 w-3" aria-label="Missing set type" role="img" />
            set
          </span>
        )}
      </button>
    </li>
  );
}

function MissingLinkDots({ artist }: { artist: ArtistWithSets }) {
  return (
    <span className="flex gap-1 shrink-0">
      {!artist.spotify_url && (
        <span
          className="h-2 w-2 rounded-full bg-green-500"
          role="img"
          aria-label="Missing Spotify link"
          title="Missing Spotify"
        />
      )}
      {!artist.soundcloud_url && (
        <span
          className="h-2 w-2 rounded-full bg-orange-500"
          role="img"
          aria-label="Missing SoundCloud link"
          title="Missing SoundCloud"
        />
      )}
      {artist.sets.some((set) => set.set_type === null) && (
        <span
          className="h-2 w-2 rounded-full bg-purple-500"
          role="img"
          aria-label="Missing set type"
          title="Missing set type"
        />
      )}
    </span>
  );
}
