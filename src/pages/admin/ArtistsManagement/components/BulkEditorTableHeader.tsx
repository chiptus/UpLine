import { TableHeader, TableRow, TableHead } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import type { SortConfig, SortingKey } from "../types";

interface BulkEditorTableHeaderProps {
  selectedCount: number;
  totalCount: number;
  onSelectAll: () => void;
  sortConfig: SortConfig;
  onSort: (key: SortingKey) => void;
}

export function BulkEditorTableHeader({
  selectedCount,
  totalCount,
  onSelectAll,
  sortConfig,
  onSort,
}: BulkEditorTableHeaderProps) {
  function getSortIndicator(key: SortingKey) {
    if (sortConfig?.key !== key) return null;
    return sortConfig.direction === "asc" ? " ↑" : " ↓";
  }

  return (
    <TableHeader>
      <TableRow>
        <TableHead className="w-12">
          <Checkbox
            checked={selectedCount === totalCount && totalCount > 0}
            onCheckedChange={onSelectAll}
          />
        </TableHead>
        <TableHead
          className="cursor-pointer hover:bg-muted min-w-48"
          onClick={() => onSort("image_url")}
        >
          Image/Logo{getSortIndicator("image_url")}
        </TableHead>
        <TableHead
          className="cursor-pointer hover:bg-muted min-w-48"
          onClick={() => onSort("name")}
        >
          Name{getSortIndicator("name")}
        </TableHead>
        <TableHead
          className="cursor-pointer hover:bg-muted min-w-64"
          onClick={() => onSort("description")}
        >
          Description{getSortIndicator("description")}
        </TableHead>
        <TableHead className="min-w-32">Genres</TableHead>
        <TableHead
          className="cursor-pointer hover:bg-muted min-w-48"
          onClick={() => onSort("spotify_url")}
        >
          Spotify URL{getSortIndicator("spotify_url")}
        </TableHead>
        <TableHead
          className="cursor-pointer hover:bg-muted min-w-48"
          onClick={() => onSort("soundcloud_url")}
        >
          SoundCloud URL{getSortIndicator("soundcloud_url")}
        </TableHead>

        <TableHead
          className="cursor-pointer hover:bg-muted"
          onClick={() => onSort("created_at")}
        >
          Created{getSortIndicator("created_at")}
        </TableHead>
      </TableRow>
    </TableHeader>
  );
}
