import { Check, Undo2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useFestivalEdition } from "@/contexts/FestivalEditionContext";
import { useAuth } from "@/contexts/AuthContext";
import { useUserPermissionsQuery } from "@/hooks/queries/auth/useUserPermissions";
import { useUpdateFestivalEditionMutation } from "@/hooks/queries/festivals/editions/useUpdateFestivalEdition";
import { isAtLeast, type RevealLevel } from "@/lib/scheduleReveal";

type Step = {
  threshold: RevealLevel;
  revealLabel: string;
  revealedLabel: string;
  demoteTo: RevealLevel;
};

const STEPS: Step[] = [
  {
    threshold: "days",
    revealLabel: "Reveal days",
    revealedLabel: "Days revealed",
    demoteTo: "draft",
  },
  {
    threshold: "stages",
    revealLabel: "Reveal stages",
    revealedLabel: "Stages revealed",
    demoteTo: "days",
  },
  {
    threshold: "full",
    revealLabel: "Reveal times",
    revealedLabel: "Times revealed",
    demoteTo: "stages",
  },
];

export function ScheduleRevealAdminPanel() {
  const { edition } = useFestivalEdition();
  const { user } = useAuth();
  const { data: isAdmin = false } = useUserPermissionsQuery(
    user?.id,
    "is_admin",
  );
  const updateMutation = useUpdateFestivalEditionMutation();

  if (!isAdmin || !edition) return null;

  const level: RevealLevel = edition.schedule_reveal_level ?? "draft";
  const isPending = updateMutation.isPending;

  function applyLevel(next: RevealLevel) {
    if (!edition) return;
    updateMutation.mutate({
      editionId: edition.id,
      editionData: { schedule_reveal_level: next },
    });
  }

  return (
    <Card className="border-purple-400/30 bg-white/5 backdrop-blur-md">
      <CardContent className="flex flex-wrap items-center gap-2 p-4">
        <span className="text-sm font-medium text-purple-200 mr-2">
          Schedule reveal:
        </span>

        {STEPS.map((step) => {
          const revealed = isAtLeast(level, step.threshold);
          if (revealed) {
            return (
              <div key={step.threshold} className="flex items-center gap-1">
                <span className="inline-flex items-center gap-1 rounded-md bg-green-600/20 text-green-300 px-2 py-1 text-sm">
                  <Check className="h-3 w-3" />
                  {step.revealedLabel}
                </span>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 px-2 text-purple-300 hover:text-white"
                  disabled={isPending}
                  onClick={() => applyLevel(step.demoteTo)}
                  title={`Demote to ${step.demoteTo}`}
                >
                  <Undo2 className="h-3 w-3" />
                </Button>
              </div>
            );
          }
          return (
            <Button
              key={step.threshold}
              size="sm"
              variant="outline"
              disabled={isPending}
              onClick={() => applyLevel(step.threshold)}
            >
              {step.revealLabel}
            </Button>
          );
        })}

        {!edition.published && level !== "draft" && (
          <p className="basis-full text-xs text-purple-300 mt-1">
            Configured but not active — edition is not published.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
