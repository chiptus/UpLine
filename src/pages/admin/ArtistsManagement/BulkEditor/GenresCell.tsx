import { useState } from "react";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { GenreMultiSelect } from "../GenreMultiSelect";
import { genresQuery } from "@/api/genres/useGenres";
import { Check, X } from "lucide-react";

interface GenresCellProps {
  value: string[];
  onSave: (genreIds: string[]) => void;
}

export function GenresCell({ value, onSave }: GenresCellProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [genreIds, setGenreIds] = useState<string[]>([]);

  const { data: genres } = useSuspenseQuery(genresQuery());

  function handleEdit() {
    const currentGenreIds = value || [];
    setGenreIds(currentGenreIds);
    setIsEditing(true);
  }

  async function handleSave() {
    const currentGenreIds = value || [];

    // Only save if genres actually changed
    if (
      JSON.stringify(currentGenreIds.sort()) === JSON.stringify(genreIds.sort())
    ) {
      setIsEditing(false);
      return;
    }

    try {
      await onSave(genreIds);
      setIsEditing(false);
    } catch (error) {
      console.error("Failed to save genres:", error);
    }
  }

  function handleCancel() {
    setIsEditing(false);
    setGenreIds([]);
  }

  if (isEditing) {
    return (
      <div className="min-w-32">
        <div className="space-y-2">
          <GenreMultiSelect
            genres={genres}
            value={genreIds}
            onValueChange={setGenreIds}
            placeholder="Select genres..."
          />
          <div className="flex gap-1">
            <Button size="sm" onClick={handleSave} className="h-6 px-2">
              <Check className="h-3 w-3" />
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={handleCancel}
              className="h-6 px-2"
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const genreNames = value
    .map((id) => genres.find((g) => g.id === id)?.name)
    .filter((i): i is NonNullable<typeof i> => !!i);

  return (
    <div
      className="cursor-pointer hover:bg-surface-active p-1 rounded min-h-6 text-sm"
      onClick={handleEdit}
      title="Click to edit"
    >
      {genreNames.length > 0 ? (
        <div className="flex flex-wrap gap-1">
          {genreNames.map((name, idx) => (
            <span
              key={idx}
              className="inline-block bg-purple-100 text-purple-800 text-xs px-2 py-1 rounded-full"
            >
              {name}
            </span>
          ))}
        </div>
      ) : (
        <span className="text-muted-foreground italic">
          Click to add genres...
        </span>
      )}
    </div>
  );
}
