import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { ArtistSelection } from "./SetsPreviewTable";
import { useArtistsQuery } from "@/hooks/queries/artists/useArtists";

interface ArtistSelectProps {
  selection: ArtistSelection;
  onValueChange: (value: string) => void;
}

export function ArtistSelect({ selection, onValueChange }: ArtistSelectProps) {
  const artistsQuery = useArtistsQuery();

  if (!artistsQuery.data) {
    return <>Loading...</>;
  }

  const allArtists = artistsQuery.data;

  const selectValue = selection.isCreating
    ? "create"
    : selection.artistId || "create";

  const exactMatch = allArtists.find(
    (a) => a.name.toLowerCase() === selection.csvName.toLowerCase(),
  );

  const displayValue = selection.isCreating ? (
    <span className="text-blue-600">Creating: {selection.csvName}</span>
  ) : (
    allArtists.find((a) => a.id === selection.artistId)?.name ||
    selection.csvName
  );

  return (
    <Select value={selectValue} onValueChange={onValueChange}>
      <SelectTrigger className="h-8 text-xs">
        <SelectValue>{displayValue}</SelectValue>
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="create">
          <span className="text-blue-600">Create new: {selection.csvName}</span>
        </SelectItem>
        {exactMatch && (
          <SelectItem key={exactMatch.id} value={exactMatch.id}>
            <span className="font-medium">
              {exactMatch.name}
              <span className="ml-1 text-green-600">✓</span>
            </span>
          </SelectItem>
        )}
        {allArtists
          .filter((a) => a.id !== exactMatch?.id)
          .map((artist) => (
            <SelectItem key={artist.id} value={artist.id}>
              {artist.name}
            </SelectItem>
          ))}
      </SelectContent>
    </Select>
  );
}
