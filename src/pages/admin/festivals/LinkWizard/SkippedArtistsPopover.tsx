import { RotateCcw, Trash2 } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import type { ArtistSkipRecord } from "@/hooks/useLinkWizardSkipped";

interface SkippedArtistsPopoverProps {
  skippedArtists: ArtistSkipRecord[];
  artists: Array<{ id: string; name: string }>;
  onRestore: (artistId: string) => void;
  onClearAll: () => void;
}

export function SkippedArtistsPopover({
  skippedArtists,
  artists,
  onRestore,
  onClearAll,
}: SkippedArtistsPopoverProps) {
  const artistMap = new Map(artists.map((a) => [a.id, a.name]));

  if (skippedArtists.length === 0) {
    return null;
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm">
          Skipped/Saved ({skippedArtists.length})
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-sm">
              Skipped/Saved Artists ({skippedArtists.length})
            </h3>
            {skippedArtists.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onClearAll}
                className="text-destructive hover:text-destructive"
                aria-label="Clear all skipped and saved artists"
                title="Clear all"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
          <ScrollArea className="h-80 pr-4">
            <ul className="space-y-2">
              {skippedArtists.map((record) => (
                <SkippedArtistItem
                  key={record.artistId}
                  record={record}
                  artistName={artistMap.get(record.artistId) || "Unknown"}
                  onRestore={onRestore}
                />
              ))}
            </ul>
          </ScrollArea>
        </div>
      </PopoverContent>
    </Popover>
  );
}

interface SkippedArtistItemProps {
  record: ArtistSkipRecord;
  artistName: string;
  onRestore: (artistId: string) => void;
}

function SkippedArtistItem({
  record,
  artistName,
  onRestore,
}: SkippedArtistItemProps) {
  const statusBadge =
    record.status === "skipped"
      ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
      : "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";

  return (
    <li className="flex items-center justify-between gap-2 p-2 rounded border border-border hover:bg-accent/50">
      <div className="flex-1 min-w-0">
        <p className="text-sm truncate">{artistName}</p>
        <span
          className={cn("inline-flex text-xs px-2 py-0.5 rounded", statusBadge)}
        >
          {record.status === "skipped" ? "Skipped" : "Saved"}
        </span>
      </div>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => onRestore(record.artistId)}
        aria-label={`Restore ${artistName} to queue`}
        title="Restore to queue"
      >
        <RotateCcw className="h-4 w-4" />
      </Button>
    </li>
  );
}
