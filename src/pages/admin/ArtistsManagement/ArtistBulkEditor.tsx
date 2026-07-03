import { useState, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { useArtistsQuery } from "@/api/artists/useArtists";
import { AddArtistDialog } from "./AddArtistDialog";
import { BulkEditorHeader } from "./components/BulkEditorHeader";
import { BulkEditorSearchAndActions } from "./components/BulkEditorSearchAndActions";
import { BulkEditorTable } from "./components/BulkEditorTable";
import { BulkEditorFooter } from "./components/BulkEditorFooter";
import { BulkEditorLoadingState } from "./components/BulkEditorLoadingState";
import { useArtistSorting } from "./hooks/useArtistSorting";
import { useArtistFiltering } from "./hooks/useArtistFiltering";
import { useArtistSelection } from "./hooks/useArtistSelection";

// Re-export types from hooks for external use
export type { SortConfig } from "./hooks/useArtistSorting";

export function ArtistBulkEditor() {
  const [addArtistOpen, setAddArtistOpen] = useState(false);

  const artistsQuery = useArtistsQuery();
  const artists = useMemo(() => artistsQuery.data || [], [artistsQuery.data]);

  // Custom hooks for managing state and logic
  const { sortConfig, handleSort, sortArtists } = useArtistSorting();
  const { searchTerm, setSearchTerm, filterArtists } = useArtistFiltering();
  const { selectedIds, handleSelectAll, handleSelectArtist, clearSelection } =
    useArtistSelection();

  // Apply filtering and sorting
  const filteredAndSortedArtists = useMemo(() => {
    const filtered = filterArtists(artists);
    return sortArtists(filtered);
  }, [artists, filterArtists, sortArtists]);

  // Wrapper function for select all
  function handleSelectAllWrapper() {
    handleSelectAll(filteredAndSortedArtists.map((a) => a.id));
  }

  if (artistsQuery.isLoading) {
    return <BulkEditorLoadingState />;
  }

  return (
    <div className="space-y-6">
      <Card>
        <BulkEditorHeader onAddArtist={() => setAddArtistOpen(true)} />

        <CardContent className="space-y-4">
          <BulkEditorSearchAndActions
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            selectedCount={selectedIds.size}
            totalCount={filteredAndSortedArtists.length}
            selectedIds={selectedIds}
            onSelectAll={handleSelectAllWrapper}
            onClearSelection={clearSelection}
          />

          <BulkEditorTable
            artists={filteredAndSortedArtists}
            selectedIds={selectedIds}
            sortConfig={sortConfig}
            searchTerm={searchTerm}
            onSort={handleSort}
            onSelectAll={handleSelectAllWrapper}
            onSelectArtist={handleSelectArtist}
          />

          <BulkEditorFooter
            filteredCount={filteredAndSortedArtists.length}
            totalCount={artists.length}
            selectedCount={selectedIds.size}
          />
        </CardContent>
      </Card>

      <AddArtistDialog
        open={addArtistOpen}
        onOpenChange={setAddArtistOpen}
        onSuccess={() => {
          // Artist list will refresh automatically via React Query
        }}
      />
    </div>
  );
}
