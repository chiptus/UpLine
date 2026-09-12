import { useState } from "react";
import { useUploadFestivalLogoMutation } from "@/api/festivals/useUploadFestivalLogo";
import { useRemoveFestivalLogoMutation } from "@/api/festivals/useRemoveFestivalLogo";
import { Festival } from "@/api/festivals/types";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2, Image as ImageIcon, Trash2 } from "lucide-react";
import { FileUpload } from "@/components/ui/file-upload";

interface FestivalLogoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  festival: Festival | null;
}

export function FestivalLogoDialog({
  open,
  onOpenChange,
  festival,
}: FestivalLogoDialogProps) {
  const uploadLogoMutation = useUploadFestivalLogoMutation();
  const removeLogoMutation = useRemoveFestivalLogoMutation();

  const [logoFile, setLogoFile] = useState<File | null>(null);

  function handleUpload() {
    if (!logoFile || !festival) return;

    uploadLogoMutation.mutate(
      { festivalId: festival.id, festivalSlug: festival.slug, logoFile },
      {
        onSuccess: () => {
          setLogoFile(null);
          onOpenChange(false);
        },
      },
    );
  }

  function handleRemoveLogo() {
    if (!festival?.logo_url) return;

    removeLogoMutation.mutate(
      { festivalId: festival.id, logoUrl: festival.logo_url },
      { onSuccess: () => onOpenChange(false) },
    );
  }

  function handleClose() {
    setLogoFile(null);
    onOpenChange(false);
  }

  if (!festival) return null;

  const hasCurrentLogo = !!festival.logo_url;
  const hasNewLogo = !!logoFile;
  const isUploading = uploadLogoMutation.isPending;
  const isDeleting = removeLogoMutation.isPending;
  const isWorking = isUploading || isDeleting;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ImageIcon className="h-5 w-5" />
            Manage Festival Logo
          </DialogTitle>
          <DialogDescription>
            Upload or remove the logo for "{festival.name}"
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Current Logo Display */}
          {hasCurrentLogo && !hasNewLogo && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium">Current Logo</h4>
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-3">
                  <img
                    src={festival.logo_url || ""}
                    alt={`${festival.name} logo`}
                    className="h-12 w-12 object-contain rounded"
                  />
                  <span className="text-sm text-muted-foreground">
                    Current logo
                  </span>
                </div>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleRemoveLogo}
                  disabled={isWorking}
                >
                  {isDeleting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
          )}

          {/* File Upload */}
          <div className="space-y-2">
            <h4 className="text-sm font-medium">
              {hasCurrentLogo ? "Upload New Logo" : "Upload Logo"}
            </h4>
            <FileUpload
              onFileSelect={setLogoFile}
              currentImageUrl={hasNewLogo ? null : festival.logo_url}
              disabled={isWorking}
              maxSize={5}
              accept="image/*"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={handleClose}
              disabled={isWorking}
            >
              Cancel
            </Button>
            {hasNewLogo && (
              <Button
                onClick={handleUpload}
                disabled={isWorking}
                className="bg-purple-600 hover:bg-purple-700"
              >
                {isUploading && (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                )}
                {isUploading ? "Uploading..." : "Upload Logo"}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
