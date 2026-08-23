import { CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Grid3X3, Plus, Copy } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { SoundCloudSyncButton } from "./SoundCloudSyncButton";

interface BulkEditorHeaderProps {
  onAddArtist: () => void;
}

export function BulkEditorHeader({ onAddArtist }: BulkEditorHeaderProps) {
  return (
    <CardHeader>
      <CardTitle className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Grid3X3 className="h-5 w-5 text-blue-600" />
          <span>Artists</span>
        </div>
        <div className="flex items-center gap-2">
          <SoundCloudSyncButton />

          <Link to="/admin/artists/duplicates">
            <Button
              variant="outline"
              size="sm"
              className="text-orange-600 hover:text-orange-700"
            >
              <Copy className="h-4 w-4 mr-1" />
              <span className="hidden md:block">Manage Duplicates</span>
            </Button>
          </Link>

          <Button
            onClick={onAddArtist}
            size="sm"
            className="bg-accent text-accent-foreground hover:bg-accent-hover"
          >
            <Plus className="h-4 w-4 mr-1" />
            <span className="hidden md:block">Add Artist</span>
          </Button>
        </div>
      </CardTitle>
    </CardHeader>
  );
}
