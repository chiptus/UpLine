import { createFileRoute } from "@tanstack/react-router";
import { ArtistBulkEditor } from "@/pages/admin/ArtistsManagement/ArtistBulkEditor";
import { genresQuery } from "@/api/genres/useGenres";

export const Route = createFileRoute("/admin/artists")({
  component: ArtistBulkEditor,
  loader: async ({ context }) => {
    void context.queryClient.ensureQueryData(genresQuery());
  },
});
