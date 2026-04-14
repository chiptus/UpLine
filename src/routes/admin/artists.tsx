import { createFileRoute } from "@tanstack/react-router";
import { ArtistBulkEditor } from "@/pages/admin/ArtistsManagement/ArtistBulkEditor";

export const Route = createFileRoute("/admin/artists")({
  component: ArtistBulkEditor,
});
