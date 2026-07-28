import { createFileRoute } from "@tanstack/react-router";
import { DuplicateArtistsPage } from "@/pages/admin/ArtistsManagement/DuplicateArtistsPage";
import { genresQuery } from "@/api/genres/useGenres";

export const Route = createFileRoute("/admin/artists/duplicates")({
  component: DuplicateArtistsPage,
  loader: async ({ context }) => {
    void context.queryClient.ensureQueryData(genresQuery());
  },
});
