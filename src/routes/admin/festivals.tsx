import { createFileRoute } from "@tanstack/react-router";
import AdminFestivals from "@/pages/admin/festivals/AdminFestivals";

export const Route = createFileRoute("/admin/festivals")({
  component: AdminFestivals,
});
