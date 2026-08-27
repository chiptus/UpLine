import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import type { ArtistWithSets } from "@/api/artists/useArtistsMissingLinksByEdition";
import { cn } from "@/lib/utils";
import { LinkWizardStageFilterButtons } from "./LinkWizardStageFilterButtons";
import { LinkWizardFilterSheet } from "./LinkWizardFilterSheet";

const MOBILE_PREVIEW_COUNT = 4;

interface LinkWizardQueueProps {
  artists: ArtistWithSets[];
  currentArtistId: string | undefined;
  onSelectArtist: (artist: ArtistWithSets) => void;
  selectedStages: string[];
  onStageToggle: (stageId: string) => void;
  onClearStages: () => void;
  isPreviewMode?: boolean;
  onViewAll?: () => void;
}

export function LinkWizardQueue({
  artists,
  currentArtistId,
  onSelectArtist,
  selectedStages,
  onStageToggle,
  onClearStages,
  isPreviewMode = false,
  onViewAll,
}: LinkWizardQueueProps) {
  const displayedArtists = isPreviewMode
    ? artists.slice(0, MOBILE_PREVIEW_COUNT)
    : artists;
  const hasMoreArtists = isPreviewMode && artists.length > MOBILE_PREVIEW_COUNT;

  const list = (
    <ul className="pb-2">
      {displayedArtists.length === 0 && (
        <li className="px-4 py-3 text-sm text-muted-foreground">
          {artists.length === 0
            ? "No artists missing links."
            : "No artists matching filter."}
        </li>
      )}
      {displayedArtists.map((artist) => (
        <LinkWizardQueueItem
          key={artist.id}
          artist={artist}
          isCurrent={artist.id === currentArtistId}
          onSelect={onSelectArtist}
        />
      ))}
    </ul>
  );

  return (
    <Card>
      <CardHeader className="pb-3 space-y-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">Queue ({artists.length})</CardTitle>
        </div>
        <div className="hidden lg:block">
          <LinkWizardStageFilterButtons
            selectedStages={selectedStages}
            onStageToggle={onStageToggle}
          />
        </div>
        <div className="lg:hidden">
          <LinkWizardFilterSheet
            selectedStages={selectedStages}
            onStageToggle={onStageToggle}
            onClearStages={onClearStages}
          />
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {isPreviewMode ? (
          <div>
            {list}
            {hasMoreArtists && (
              <div className="px-4 py-2 border-t">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="w-full text-xs text-accent hover:text-accent hover:bg-accent-soft"
                  onClick={onViewAll}
                >
                  View all ({artists.length - MOBILE_PREVIEW_COUNT} more)
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

interface LinkWizardQueueItemProps {
  artist: ArtistWithSets;
  isCurrent: boolean;
  onSelect: (artist: ArtistWithSets) => void;
}

function LinkWizardQueueItem({
  artist,
  isCurrent,
  onSelect,
}: LinkWizardQueueItemProps) {
  return (
    <li>
      <button
        type="button"
        onClick={() => onSelect(artist)}
        aria-current={isCurrent}
        className={cn(
          "w-full text-left px-4 py-2 hover:bg-accent/40 flex items-center justify-between gap-2 border-l-2 border-transparent",
          isCurrent && "bg-accent/20 border-primary",
        )}
      >
        <span className="truncate text-sm">{artist.name}</span>
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
        </span>
      </button>
    </li>
  );
}
