import { useState } from "react";
import { SlugCellEditor, type SlugSaveCallbacks } from "./SlugCellEditor";

interface SlugCellProps {
  artistId: string;
  value: string;
  onSave: (slug: string, callbacks: SlugSaveCallbacks) => void;
}

export function SlugCell({ artistId, value, onSave }: SlugCellProps) {
  const [isEditing, setIsEditing] = useState(false);

  if (isEditing) {
    return (
      <SlugCellEditor
        artistId={artistId}
        value={value}
        onSave={onSave}
        onClose={() => setIsEditing(false)}
      />
    );
  }

  return (
    <button
      type="button"
      className="w-full text-left cursor-pointer hover:bg-surface-active p-1 rounded min-h-6 text-sm font-mono"
      onClick={() => setIsEditing(true)}
      title="Click to edit"
    >
      {value}
    </button>
  );
}
