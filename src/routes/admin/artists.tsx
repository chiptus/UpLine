import { createFileRoute, stripSearchParams } from "@tanstack/react-router";
import { useCallback, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { artistsPageQuery } from "@/api/artists/useArtistsPage";
import { AddArtistDialog } from "@/pages/admin/ArtistsManagement/AddArtistDialog";
import { BulkEditorHeader } from "@/pages/admin/ArtistsManagement/components/BulkEditorHeader";
import { BulkEditorSearchAndActions } from "@/pages/admin/ArtistsManagement/components/BulkEditorSearchAndActions";
import { BulkEditorTable } from "@/pages/admin/ArtistsManagement/components/BulkEditorTable";
import { BulkEditorFooter } from "@/pages/admin/ArtistsManagement/components/BulkEditorFooter";
import { BulkEditorPagination } from "@/pages/admin/ArtistsManagement/components/BulkEditorPagination";
import { useArtistFiltering } from "@/pages/admin/ArtistsManagement/hooks/useArtistFiltering";
import type { SortConfig } from "@/pages/admin/ArtistsManagement/types";
import { useArtistSelection } from "@/pages/admin/ArtistsManagement/hooks/useArtistSelection";
import { useAdminArtistsUrlState } from "@/pages/admin/ArtistsManagement/hooks/useAdminArtistsUrlState";
import { genresQuery } from "@/api/genres/useGenres";
import {
  adminArtistsSearchDefaults,
  adminArtistsSearchSchema,
} from "@/lib/searchSchemas";

const PAGE_SIZE = 25;

export const Route = createFileRoute("/admin/artists")({
  component: ArtistBulkEditor,
  validateSearch: adminArtistsSearchSchema,
  search: {
    middlewares: [stripSearchParams(adminArtistsSearchDefaults)],
  },
  loaderDeps: ({ search }) => search,
  loader: async ({ context, deps }) => {
    void context.queryClient.ensureQueryData(genresQuery());
    void context.queryClient.ensureQueryData(
      artistsPageQuery({
        page: deps.page,
        pageSize: PAGE_SIZE,
        search: deps.q,
        sortKey: deps.sortKey,
        sortDir: deps.sortDir,
      }),
    );
  },
});

function ArtistBulkEditor() {
  const [addArtistOpen, setAddArtistOpen] = useState(false);

  const { state: urlState, updateUrlState } = useAdminArtistsUrlState();

  const handleDebouncedSearchChange = useCallback(
    (q: string) => updateUrlState({ q, page: 0 }),
    [updateUrlState],
  );
  const { searchTerm, setSearchTerm } = useArtistFiltering(
    urlState.q,
    handleDebouncedSearchChange,
  );

  const sortConfig: SortConfig = {
    key: urlState.sortKey,
    direction: urlState.sortDir,
  };
  function handleSort(key: SortConfig["key"]) {
    updateUrlState({
      sortKey: key,
      sortDir:
        sortConfig.key === key && sortConfig.direction === "asc"
          ? "desc"
          : "asc",
      page: 0,
    });
  }

  const { data, isPending } = useQuery(
    artistsPageQuery({
      page: urlState.page,
      pageSize: PAGE_SIZE,
      search: urlState.q,
      sortKey: urlState.sortKey,
      sortDir: urlState.sortDir,
    }),
  );
  const artists = data?.artists ?? [];
  const totalCount = data?.totalCount ?? 0;

  const { selectedIds, handleSelectAll, handleSelectArtist, clearSelection } =
    useArtistSelection();

  if (isPending) {
    return (
      <div className="flex items-center justify-center py-12 text-muted-foreground">
        Loading artists...
      </div>
    );
  }

  function handleSelectAllWrapper() {
    handleSelectAll(artists.map((a) => a.id));
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
            totalCount={artists.length}
            selectedIds={selectedIds}
            onSelectAll={handleSelectAllWrapper}
            onClearSelection={clearSelection}
          />

          <BulkEditorTable
            artists={artists}
            selectedIds={selectedIds}
            sortConfig={sortConfig}
            searchTerm={urlState.q}
            onSort={handleSort}
            onSelectAll={handleSelectAllWrapper}
            onSelectArtist={handleSelectArtist}
          />

          <BulkEditorPagination
            page={urlState.page}
            pageSize={PAGE_SIZE}
            totalCount={totalCount}
            onPageChange={(page) => {
              clearSelection();
              updateUrlState({ page });
            }}
          />

          <BulkEditorFooter
            pageCount={artists.length}
            totalCount={totalCount}
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
