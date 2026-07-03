import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";
import type { DuplicateGroup } from "@/api/artists/useDuplicateArtists";
import { useBulkMergeArtistsMutation } from "@/api/artists/useBulkMergeArtists";
import { BulkMergeStrategySelector } from "./components/BulkMergeStrategySelector";
import { BulkMergeProgressDialog } from "./components/BulkMergeProgressDialog";
import { BulkMergeCompleteDialog } from "./components/BulkMergeCompleteDialog";

interface BulkMergeDialogProps {
  selectedGroups: DuplicateGroup[];
  onClose: () => void;
}

type MergeStrategy = "smart" | "first" | "newest" | "oldest";

interface MergeProgress {
  total: number;
  completed: number;
  current?: string;
  errors: Array<{ group: string; error: string }>;
}

export function BulkMergeDialog({
  selectedGroups,
  onClose,
}: BulkMergeDialogProps) {
  const [strategy, setStrategy] = useState<MergeStrategy>("smart");
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState<MergeProgress | null>(null);
  const [isComplete, setIsComplete] = useState(false);

  const bulkMergeMutation = useBulkMergeArtistsMutation();

  const totalArtists = selectedGroups.reduce(
    (sum, group) => sum + group.count,
    0,
  );
  const duplicatesToDelete = selectedGroups.reduce(
    (sum, group) => sum + (group.count - 1),
    0,
  );

  function handleStartMerge() {
    setIsProcessing(true);
    setProgress({ total: selectedGroups.length, completed: 0, errors: [] });

    bulkMergeMutation.mutate({
      params: {
        groups: selectedGroups,
        strategy,
      },
      onProgress: (newProgress) => {
        setProgress(newProgress);
        if (newProgress.completed === newProgress.total) {
          setIsProcessing(false);
          setIsComplete(true);
        }
      },
    });
  }

  if (isComplete) {
    return (
      <BulkMergeCompleteDialog
        progress={progress}
        selectedGroupsLength={selectedGroups.length}
        duplicatesToDelete={duplicatesToDelete}
        onClose={onClose}
      />
    );
  }

  if (isProcessing) {
    return (
      <BulkMergeProgressDialog
        progress={progress}
        selectedGroupsLength={selectedGroups.length}
      />
    );
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[95vh] overflow-hidden flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle>Bulk Merge Duplicate Artists</DialogTitle>
          <DialogDescription>
            Merge {selectedGroups.length} duplicate groups containing{" "}
            {totalArtists} total artists. This will delete {duplicatesToDelete}{" "}
            duplicate entries.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-4 py-2">
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              This action cannot be undone. All votes, sets, and notes will be
              transferred to the primary artist in each group.
            </AlertDescription>
          </Alert>

          <BulkMergeStrategySelector
            strategy={strategy}
            onStrategyChange={setStrategy}
          />

          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <h4 className="font-medium mb-2 text-sm">
              Selected Groups Preview
            </h4>
            <div className="text-xs space-y-1 max-h-24 overflow-y-auto">
              {selectedGroups.map((group) => (
                <p key={group.name}>
                  <strong>{group.name}</strong> ({group.count} duplicates)
                </p>
              ))}
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row justify-end gap-2 pt-3 border-t flex-shrink-0">
          <Button variant="outline" onClick={onClose} className="sm:order-1">
            Cancel
          </Button>
          <Button
            onClick={handleStartMerge}
            className="bg-red-600 hover:bg-red-700 sm:order-2"
          >
            <span className="hidden sm:inline">
              Start Bulk Merge ({duplicatesToDelete} deletions)
            </span>
            <span className="sm:hidden">
              Merge {duplicatesToDelete} duplicates
            </span>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
