import { createFileRoute } from "@tanstack/react-router";
import { editionBySlugQuery } from "@/api/editions/useFestivalEditionBySlug";
import { ScheduleImportWizard } from "@/components/Admin/ScheduleImport/ScheduleImportWizard";

export const Route = createFileRoute(
  "/admin/festivals/$festivalSlug/editions/$editionSlug/import",
)({
  loader: ({ params, context }) =>
    context.queryClient.ensureQueryData(
      editionBySlugQuery({
        festivalId: context.festival.id,
        editionSlug: params.editionSlug,
      }),
    ),
  component: FestivalScheduleImport,
});

function FestivalScheduleImport() {
  const { festival } = Route.useRouteContext();
  const edition = Route.useLoaderData();
  return (
    <ScheduleImportWizard
      festivalEditionId={edition.id}
      currentRevealLevel={edition.schedule_reveal_level ?? "draft"}
      defaultTimezone={festival.timezone}
    />
  );
}
