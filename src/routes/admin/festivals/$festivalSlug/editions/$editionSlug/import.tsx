import { createFileRoute } from "@tanstack/react-router";
import { editionBySlugQuery } from "@/api/editions/useFestivalEditionBySlug";
import {
  festivalBySlugQuery,
  useFestivalBySlugQuery,
} from "@/api/festivals/useFestivalBySlug";
import { ScheduleImportWizard } from "@/components/Admin/ScheduleImport/ScheduleImportWizard";

export const Route = createFileRoute(
  "/admin/festivals/$festivalSlug/editions/$editionSlug/import",
)({
  loader: async ({ params, context }) => {
    const festival = await context.queryClient.ensureQueryData(
      festivalBySlugQuery(params.festivalSlug),
    );
    return context.queryClient.ensureQueryData(
      editionBySlugQuery({
        festivalId: festival.id,
        editionSlug: params.editionSlug,
      }),
    );
  },
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
