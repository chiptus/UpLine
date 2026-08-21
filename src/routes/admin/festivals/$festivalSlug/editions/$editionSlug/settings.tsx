import { createFileRoute, useParams } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { useFestivalEditionBySlugQuery } from "@/api/editions/useFestivalEditionBySlug";
import { festivalBySlugQuery } from "@/api/festivals/useFestivalBySlug";
import { getFestivalPhase } from "@/lib/festivalPhase";
import { ScheduleRevealControl } from "@/pages/admin/festivals/ScheduleRevealControl";
import { PhaseOverrideControl } from "@/pages/admin/festivals/PhaseOverrideControl";
import { pageMeta } from "@/lib/pageHead";

export const Route = createFileRoute(
  "/admin/festivals/$festivalSlug/editions/$editionSlug/settings",
)({
  component: FestivalEditionSettings,
  head: ({ match }) => ({
    meta: pageMeta({
      title: "Settings",
      prefix: `Admin - ${match.context.festival?.name}`,
    }),
  }),
});

function FestivalEditionSettings() {
  const { festivalSlug, editionSlug } = useParams({
    from: "/admin/festivals/$festivalSlug/editions/$editionSlug/settings",
  });
  const { data: festival } = useSuspenseQuery(
    festivalBySlugQuery(festivalSlug),
  );
  const editionQuery = useFestivalEditionBySlugQuery({
    editionSlug,
    festivalId: festival.id,
  });

  if (editionQuery.isLoading || !editionQuery.data) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-8">
          <Loader2 className="h-6 w-6 animate-spin mr-2" />
          <span>Loading settings...</span>
        </CardContent>
      </Card>
    );
  }

  const currentEdition = editionQuery.data;

  const derivedPhase = getFestivalPhase({
    revealLevel: currentEdition.schedule_reveal_level ?? "draft",
    startDate: currentEdition.start_date,
    endDate: currentEdition.end_date,
    timezone: festival.timezone,
    now: new Date(),
  });

  return (
    <Card>
      <CardContent className="flex flex-wrap items-center justify-between gap-3 py-4">
        <ScheduleRevealControl
          editionId={currentEdition.id}
          level={currentEdition.schedule_reveal_level ?? "draft"}
          editionPublished={currentEdition.published ?? false}
        />
        <PhaseOverrideControl
          editionId={currentEdition.id}
          override={currentEdition.phase_override ?? null}
          derivedPhase={derivedPhase}
        />
      </CardContent>
    </Card>
  );
}
