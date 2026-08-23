import { useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Trash } from "lucide-react";
import { Artist } from "@/api/artists/types";

interface ArchiveArtistDialogProps {
  artist: Artist;
  onArchive: ((artistId: string) => Promise<void>) | (() => Promise<void>);
  trigger?: React.ReactNode;
}

export function ArchiveArtistDialog({
  artist,
  onArchive,
  trigger,
}: ArchiveArtistDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleArchive() {
    try {
      setLoading(true);
      // Handle both function signatures
      if (onArchive.length > 0) {
        await (onArchive as (artistId: string) => Promise<void>)(artist.id);
      } else {
        await (onArchive as () => Promise<void>)();
      }
      setOpen(false);
    } catch (error) {
      console.error("Failed to archive artist:", error);
    } finally {
      setLoading(false);
    }
  }

  const defaultTrigger = (
    <Button
      variant="outline"
      size="sm"
      className="border-red-400 text-red-400 hover:bg-red-400 hover:text-destructive-foreground"
    >
      <Trash className="h-4 w-4" />
    </Button>
  );

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        {trigger || defaultTrigger}
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Archive Artist</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to archive <strong>{artist.name}</strong>?
            This will hide the artist from the main list but preserve all data
            and votes. The artist can be restored later by Core team members.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleArchive}
            disabled={loading}
            className="bg-red-600 hover:bg-red-700"
          >
            {loading ? "Archiving..." : "Archive Artist"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
