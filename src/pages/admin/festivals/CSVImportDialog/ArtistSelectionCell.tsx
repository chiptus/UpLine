import { TableCell } from "@/components/ui/table";
import type { ArtistSelection } from "./SetsPreviewTable";
import { ArtistSelect } from "./ArtistSelect";

interface ArtistSelectionCellProps {
  artistSelections: ArtistSelection[];
  allArtists: Array<{ id: string; name: string }>;
  isLoadingMatches: boolean;
  validationError?: string;
  onArtistSelectionChange: (artistIndex: number, value: string) => void;
}

export function ArtistSelectionCell({
  artistSelections,
  allArtists,
  isLoadingMatches,
  validationError,
  onArtistSelectionChange,
}: ArtistSelectionCellProps) {
  return (
    <TableCell>
      <div className="space-y-2">
        {isLoadingMatches ? (
          <div className="text-sm text-muted-foreground">Loading...</div>
        ) : (
          artistSelections.map((selection, artistIdx) => (
            <ArtistSelect
              key={artistIdx}
              selection={selection}
              allArtists={allArtists}
              onValueChange={(value) =>
                onArtistSelectionChange(artistIdx, value)
              }
            />
          ))
        )}
        {validationError && (
          <div className="text-xs text-destructive">{validationError}</div>
        )}
      </div>
    </TableCell>
  );
}
