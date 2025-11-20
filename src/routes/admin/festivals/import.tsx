import { createFileRoute } from "@tanstack/react-router";
import { CSVImportPage } from "@/pages/admin/festivals/CSVImportPage";

export const Route = createFileRoute("/admin/festivals/import")({
  component: CSVImportPage,
});
