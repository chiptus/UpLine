import { createFileRoute } from "@tanstack/react-router";
import { editionBySlugQuery } from "@/api/editions/useFestivalEditionBySlug";
import { useFestivalBySlugQuery } from "@/api/festivals/useFestivalBySlug";
import { ScheduleImportWizard } from "@/components/Admin/ScheduleImport/ScheduleImportWizard";

export const Route = createFileRoute(
  "/admin/festivals/$festivalSlug/editions/$editionSlug/import",
)({
  loader: ({ params, context }) =>
    context.queryClient.ensureQueryData(
      editionBySlugQuery({
        festivalSlug: params.festivalSlug,
        editionSlug: params.editionSlug,
      }),
    ),
  component: FestivalScheduleImport,
});

function FestivalScheduleImport() {
  const { festivalSlug } = Route.useParams();
  const edition = Route.useLoaderData();
  const festivalQuery = useFestivalBySlugQuery(festivalSlug);
  return (
    <ScheduleImportWizard
      festivalEditionId={edition.id}
      currentRevealLevel={edition.schedule_reveal_level ?? "draft"}
      defaultTimezone={festivalQuery.data?.timezone}
    />
  );
}
