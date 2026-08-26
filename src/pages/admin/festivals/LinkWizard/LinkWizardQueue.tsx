import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { ArtistWithSets } from "@/api/artists/useArtistsMissingLinksByEdition";
import { cn } from "@/lib/utils";

interface LinkWizardQueueProps {
  artists: ArtistWithSets[];
  currentArtistId: string | undefined;
  onSelectArtist: (artist: ArtistWithSets) => void;
}

export function LinkWizardQueue({
  artists,
  currentArtistId,
  onSelectArtist,
}: LinkWizardQueueProps) {
  return (
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
              <LinkWizardQueueItem
                key={artist.id}
                artist={artist}
                isCurrent={artist.id === currentArtistId}
                onSelect={onSelectArtist}
              />
            ))}
          </ul>
        </ScrollArea>
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
