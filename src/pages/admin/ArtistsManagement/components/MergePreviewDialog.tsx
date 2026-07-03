import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import type { Artist } from "@/api/artists/types";
import { GenreBadge } from "@/components/GenreBadge";

interface MergeChoices {
  name: string;
  description: string | null;
  spotify_url: string | null;
  soundcloud_url: string | null;
  genres: string[];
}

interface MergePreviewDialogProps {
  artists: Artist[];
  mergeChoices: MergeChoices;
  isLoading: boolean;
  onBack: () => void;
  onConfirm: () => void;
}

export function MergePreviewDialog({
  artists,
  mergeChoices,
  isLoading,
  onBack,
  onConfirm,
}: MergePreviewDialogProps) {
  function formatDate(date: string) {
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  }

  return (
    <Dialog open onOpenChange={onBack}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Confirm Merge</DialogTitle>
          <DialogDescription>
            Review the merged artist data before confirming. This action cannot
            be undone.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="p-4 border rounded-lg bg-blue-50 border-blue-200">
            <h3 className="font-semibold mb-3">Merged Artist Preview</h3>

            <div className="space-y-3">
              <div>
                <Label className="text-xs text-muted-foreground">NAME</Label>
                <p className="font-medium">{mergeChoices.name}</p>
              </div>

              {mergeChoices.description && (
                <div>
                  <Label className="text-xs text-muted-foreground">
                    DESCRIPTION
                  </Label>
                  <p className="text-sm">{mergeChoices.description}</p>
                </div>
              )}

              <div className="flex gap-4">
                {mergeChoices.spotify_url && (
                  <div>
                    <Label className="text-xs text-muted-foreground">
                      SPOTIFY
                    </Label>
                    <p className="text-sm text-blue-600">Connected</p>
                  </div>
                )}
                {mergeChoices.soundcloud_url && (
                  <div>
                    <Label className="text-xs text-muted-foreground">
                      SOUNDCLOUD
                    </Label>
                    <p className="text-sm text-blue-600">Connected</p>
                  </div>
                )}
              </div>

              {mergeChoices.genres.length > 0 && (
                <div>
                  <Label className="text-xs text-muted-foreground mb-2 block">
                    GENRES
                  </Label>
                  <div className="flex flex-wrap gap-1">
                    {mergeChoices.genres.map((genreId) => (
                      <GenreBadge key={genreId} genreId={genreId} />
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="p-4 border rounded-lg bg-red-50 border-red-200">
            <h3 className="font-semibold text-red-800 mb-2">
              Artists to be Deleted
            </h3>
            <p className="text-sm text-red-700 mb-3">
              The following {artists.length - 1} duplicate artist(s) will be
              permanently deleted:
            </p>
            <ul className="text-sm text-red-700 space-y-1">
              {artists.slice(1).map((artist) => (
                <li key={artist.id}>
                  • ID: {artist.id.slice(-8)} (Created:{" "}
                  {formatDate(artist.created_at)})
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-4">
          <Button variant="outline" onClick={onBack} disabled={isLoading}>
            Back to Edit
          </Button>
          <Button
            onClick={onConfirm}
            className="bg-red-600 hover:bg-red-700"
            disabled={isLoading}
          >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isLoading ? "Merging..." : "Confirm Merge & Delete"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
