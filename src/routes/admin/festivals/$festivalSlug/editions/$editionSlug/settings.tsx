import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { editionBySlugQuery } from "@/api/editions/useFestivalEditionBySlug";
import { festivalBySlugQuery } from "@/api/festivals/useFestivalBySlug";
import { getFestivalPhase, phaseInputFromEdition } from "@/lib/festivalPhase";
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
  const { festivalSlug, editionSlug } = Route.useParams();
  const { data: festival } = useSuspenseQuery(
    festivalBySlugQuery(festivalSlug),
  );
  const { data: currentEdition } = useSuspenseQuery(
    editionBySlugQuery({ festivalId: festival.id, editionSlug }),
  );

  // Deliberately the derived phase, not the override-aware one: this feeds
  // the "Automatic (...)" option label below, which must show what automatic
  // derivation would currently produce even when an override is active — the
  // override itself is read separately as the control's selected value.
  const { derivedInput } = phaseInputFromEdition(
    currentEdition,
    festival.timezone,
    new Date(),
  );
  const derivedPhase = getFestivalPhase(derivedInput);

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
