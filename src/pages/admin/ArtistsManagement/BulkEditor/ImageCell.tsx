import { useState } from "react";
import { ImageEditDialog } from "./ImageEditDialog";

interface ImageCellProps {
  value: string | null;
  artistSlug: string;
  artistName: string;
  onSave: (value: string | null) => void;
}

export function ImageCell({
  value,
  artistSlug,
  artistName,
  onSave,
}: ImageCellProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const displayContent = value ? (
    <img
      src={value}
      alt="Artist"
      className="w-8 h-8 object-cover rounded border"
      onError={(e) => {
        (e.target as HTMLImageElement).style.display = "none";
      }}
    />
  ) : (
    <span className="text-muted-foreground italic text-xs">add image...</span>
  );

  return (
    <>
      <div
        className="cursor-pointer hover:bg-gray-50 p-1 rounded min-h-10 text-sm flex items-center"
        onClick={() => setIsDialogOpen(true)}
        title="Click to edit image"
      >
        {displayContent}
      </div>

      {isDialogOpen && (
        <ImageEditDialog
          open={isDialogOpen}
          onOpenChange={setIsDialogOpen}
          currentImageUrl={value}
          artistSlug={artistSlug}
          artistName={artistName}
          onSave={onSave}
        />
      )}
    </>
  );
}
