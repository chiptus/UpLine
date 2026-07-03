import { Table, TableBody } from "@/components/ui/table";
import type { Artist } from "@/api/artists/types";
import type { SortConfig, SortingKey } from "../hooks/useArtistSorting";
import { BulkEditorTableHeader } from "./BulkEditorTableHeader";
import { BulkEditorTableRow } from "./BulkEditorTableRow";

interface BulkEditorTableProps {
  artists: Artist[];
  selectedIds: Set<string>;
  sortConfig: SortConfig;
  searchTerm: string;
  onSort: (key: SortingKey) => void;
  onSelectAll: () => void;
  onSelectArtist: (artistId: string, isSelected: boolean) => void;
}

export function BulkEditorTable({
  artists,
  selectedIds,
  sortConfig,
  searchTerm,
  onSort,
  onSelectAll,
  onSelectArtist,
}: BulkEditorTableProps) {
  return (
    <div className="rounded-md border overflow-x-auto">
      <Table>
        <BulkEditorTableHeader
          selectedCount={selectedIds.size}
          totalCount={artists.length}
          onSelectAll={onSelectAll}
          sortConfig={sortConfig}
          onSort={onSort}
        />
        <TableBody>
          {artists.map((artist) => (
            <BulkEditorTableRow
              key={artist.id}
              artist={artist}
              isSelected={selectedIds.has(artist.id)}
              onSelectChange={(isSelected) =>
                onSelectArtist(artist.id, isSelected)
              }
            />
          ))}
        </TableBody>
      </Table>

      {artists.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          {searchTerm
            ? "No artists found matching your search."
            : "No artists found."}
        </div>
      )}
    </div>
  );
}
