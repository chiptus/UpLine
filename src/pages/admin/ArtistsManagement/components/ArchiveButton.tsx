import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Archive } from "lucide-react";
import { useBulkArchiveArtistsMutation } from "@/api/artists/useBulkArchiveArtists";

interface ArchiveButtonProps {
  selectedIds: Set<string>;
  selectedCount: number;
  onSuccess: () => void;
}

export function ArchiveButton({
  selectedIds,
  selectedCount,
  onSuccess,
}: ArchiveButtonProps) {
  const [showConfirm, setShowConfirm] = useState(false);
  const bulkArchiveMutation = useBulkArchiveArtistsMutation();

  function handleConfirmArchive() {
    if (selectedIds.size > 0) {
      bulkArchiveMutation.mutate(Array.from(selectedIds), {
        onSuccess: () => {
          setShowConfirm(false);
          onSuccess();
        },
      });
    }
  }

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setShowConfirm(true)}
        disabled={bulkArchiveMutation.isPending || selectedCount === 0}
      >
        <Archive className="h-3 w-3 mr-1" />
        {bulkArchiveMutation.isPending ? "Archiving..." : "Archive"}
      </Button>

      <AlertDialog open={showConfirm} onOpenChange={setShowConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Archive Artists</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to archive {selectedCount} selected artist
              {selectedCount === 1 ? "" : "s"}? This will hide{" "}
              {selectedCount === 1 ? "the artist" : "them"} from the main list
              but preserve all data and votes.
              {selectedCount === 1 ? "The artist" : "They"} can be restored
              later by Core team members.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={bulkArchiveMutation.isPending}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmArchive}
              disabled={bulkArchiveMutation.isPending}
              className="bg-red-600 hover:bg-red-700"
            >
              {bulkArchiveMutation.isPending
                ? "Archiving..."
                : `Archive ${selectedCount} Artist${selectedCount === 1 ? "" : "s"}`}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
