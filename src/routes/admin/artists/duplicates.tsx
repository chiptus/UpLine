import { createFileRoute } from "@tanstack/react-router";
import { DuplicateArtistsPage } from "@/pages/admin/ArtistsManagement/DuplicateArtistsPage";

export const Route = createFileRoute("/admin/artists/duplicates")({
  component: DuplicateArtistsPage,
});
