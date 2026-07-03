import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import type { Artist } from "@/api/artists/types";
import { GenreBadge } from "@/components/GenreBadge";

interface FieldSelectorProps {
  label: string;
  fieldKey: string;
  artists: Artist[];
  selectedValue: string | null;
  onValueChange: (value: string | null) => void;
  renderValue?: (value: string, index: number) => React.ReactNode;
}

export function FieldSelector({
  label,
  fieldKey,
  artists,
  selectedValue,
  onValueChange,
  renderValue,
}: FieldSelectorProps) {
  function handleValueChange(value: string) {
    onValueChange(value === "none" ? null : value);
  }

  return (
    <div>
      <Label className="text-sm font-medium mb-3 block">{label}</Label>
      <RadioGroup
        value={selectedValue || "none"}
        onValueChange={handleValueChange}
      >
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="none" id={`${fieldKey}-none`} />
          <Label
            htmlFor={`${fieldKey}-none`}
            className="text-sm text-muted-foreground"
          >
            No {label.toLowerCase()}
          </Label>
        </div>
        {artists.map((artist, index) => {
          const value = artist[fieldKey as keyof Artist] as string | null;
          if (!value) return null;

          return (
            <div key={artist.id} className="flex items-start space-x-2">
              <RadioGroupItem value={value} id={`${fieldKey}-${index}`} />
              <Label
                htmlFor={`${fieldKey}-${index}`}
                className="text-sm flex-1"
              >
                <span className="font-medium">#{index + 1}:</span>{" "}
                {renderValue ? renderValue(value, index) : value}
              </Label>
            </div>
          );
        })}
      </RadioGroup>
    </div>
  );
}

interface GenreSelectorProps {
  availableGenres: string[];
  selectedGenres: string[];
  onGenreToggle: (genreId: string) => void;
}

export function GenreSelector({
  availableGenres,
  selectedGenres,
  onGenreToggle,
}: GenreSelectorProps) {
  return (
    <div>
      <Label className="text-sm font-medium mb-3 block">
        Genres (select all that apply)
      </Label>
      <div className="grid grid-cols-2 gap-2">
        {availableGenres.map((genreId) => (
          <div key={genreId} className="flex items-center space-x-2">
            <input
              type="checkbox"
              id={`genre-${genreId}`}
              checked={selectedGenres.includes(genreId)}
              onChange={() => onGenreToggle(genreId)}
              className="rounded"
            />
            <Label htmlFor={`genre-${genreId}`} className="text-sm">
              <GenreBadge genreId={genreId} />
            </Label>
          </div>
        ))}
      </div>
    </div>
  );
}
