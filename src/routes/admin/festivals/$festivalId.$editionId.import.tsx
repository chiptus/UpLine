import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { CSVImportPage } from "@/pages/admin/festivals/CSVImportPage";

const importSearchSchema = z.object({
  tab: z.enum(["stages", "sets"]).optional(),
});

export const Route = createFileRoute(
  "/admin/festivals/$festivalId/$editionId/import",
)({
  component: CSVImportPage,
  validateSearch: importSearchSchema,
});
