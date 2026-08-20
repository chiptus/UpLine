import { createFileRoute } from "@tanstack/react-router";
import { ScheduleImportWizard } from "@/components/Admin/ScheduleImport/ScheduleImportWizard";
import { pageMeta } from "@/lib/pageHead";

export const Route = createFileRoute(
  "/admin/festivals/$festivalSlug/editions/$editionSlug/import",
)({
  component: FestivalScheduleImport,
  head: ({ match }) => ({
    meta: pageMeta({
      title: "Import",
      prefix: `Admin - ${match.context.festival?.name} - ${match.context.edition?.name}`,
    }),
  }),
});

function FestivalScheduleImport() {
  const { festival, edition } = Route.useRouteContext();
  return (
    <>
      <ScheduleImportWizard
        festivalEditionId={edition.id}
        currentRevealLevel={edition.schedule_reveal_level ?? "draft"}
        defaultTimezone={festival.timezone}
      />
    </>
  );
}
