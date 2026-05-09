import { createFileRoute } from "@tanstack/react-router";
import { editionsKeys } from "@/hooks/queries/festivals/editions/types";
import { fetchFestivalEditionBySlug } from "@/hooks/queries/festivals/editions/useFestivalEditionBySlug";
import { ScheduleImportWizard } from "@/components/Admin/ScheduleImport/ScheduleImportWizard";

export const Route = createFileRoute(
  "/admin/festivals/$festivalSlug/editions/$editionSlug/import",
)({
  loader: ({ params, context }) =>
    context.queryClient.ensureQueryData({
      queryKey: editionsKeys.bySlug(params.festivalSlug, params.editionSlug),
      queryFn: () =>
        fetchFestivalEditionBySlug({
          festivalSlug: params.festivalSlug,
          editionSlug: params.editionSlug,
        }),
    }),
  component: FestivalScheduleImport,
});

function FestivalScheduleImport() {
  const edition = Route.useLoaderData();
  return <ScheduleImportWizard festivalEditionId={edition.id} />;
}
