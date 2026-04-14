import { createFileRoute } from "@tanstack/react-router";
import { CSVImportPage } from "@/pages/admin/festivals/CSVImportPage";
import { z } from "zod";

const importSearchSchema = z.object({
  tab: z.enum(["sets", "stages"]).optional(),
});

export const Route = createFileRoute("/admin/festivals/import")({
  component: CSVImportPage,
  validateSearch: importSearchSchema,
});
