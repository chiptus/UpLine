import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { useArtistsQuery } from "@/api/artists/useArtists";
import { AddArtistDialog } from "@/pages/admin/ArtistsManagement/AddArtistDialog";
import { BulkEditorHeader } from "@/pages/admin/ArtistsManagement/components/BulkEditorHeader";
import { BulkEditorSearchAndActions } from "@/pages/admin/ArtistsManagement/components/BulkEditorSearchAndActions";
import { BulkEditorTable } from "@/pages/admin/ArtistsManagement/components/BulkEditorTable";
import { BulkEditorFooter } from "@/pages/admin/ArtistsManagement/components/BulkEditorFooter";
import { BulkEditorLoadingState } from "@/pages/admin/ArtistsManagement/components/BulkEditorLoadingState";
import { useArtistSorting } from "@/pages/admin/ArtistsManagement/hooks/useArtistSorting";
import { useArtistFiltering } from "@/pages/admin/ArtistsManagement/hooks/useArtistFiltering";
import { useArtistSelection } from "@/pages/admin/ArtistsManagement/hooks/useArtistSelection";
import { genresQuery } from "@/api/genres/useGenres";

export const Route = createFileRoute("/admin/artists")({
  component: ArtistBulkEditor,
  loader: async ({ context }) => {
    void context.queryClient.ensureQueryData(genresQuery());
  },
});

function ArtistBulkEditor() {
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
