import { createFileRoute } from "@tanstack/react-router";
import { ScheduleImportWizard } from "@/components/Admin/ScheduleImport/ScheduleImportWizard";
import { PageTitle } from "@/components/PageTitle/PageTitle";

export const Route = createFileRoute(
  "/admin/festivals/$festivalSlug/editions/$editionSlug/import",
)({
  component: FestivalScheduleImport,
});

function FestivalScheduleImport() {
  const { festival, edition } = Route.useRouteContext();
  return (
    <>
      <PageTitle
        title="Import"
        prefix={`Admin - ${festival.name} - ${edition.name}`}
      />
      <ScheduleImportWizard
        festivalEditionId={edition.id}
        currentRevealLevel={edition.schedule_reveal_level ?? "draft"}
        defaultTimezone={festival.timezone}
      />
    </>
  );
}
