import { Check, Undo2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useUpdateFestivalEditionMutation } from "@/api/editions/useUpdateFestivalEdition";
import type { RevealLevel } from "@/lib/scheduleReveal";

type Props = {
  editionId: string;
  level: RevealLevel;
  editionPublished: boolean;
};

const NEXT: Record<Exclude<RevealLevel, "full">, RevealLevel> = {
  draft: "days",
  days: "stages",
  stages: "full",
};

const PREVIOUS: Record<Exclude<RevealLevel, "draft">, RevealLevel> = {
  days: "draft",
  stages: "days",
  full: "stages",
};

const STATUS_LABEL: Record<RevealLevel, string> = {
  draft: "Schedule: draft",
  days: "Schedule: days revealed",
  stages: "Schedule: stages revealed",
  full: "Schedule: fully revealed",
};

const ADVANCE_LABEL: Record<Exclude<RevealLevel, "full">, string> = {
  draft: "Reveal days",
  days: "Reveal stages",
  stages: "Reveal times",
};

export function ScheduleRevealControl({
  editionId,
  level,
  editionPublished,
}: Props) {
  const mutation = useUpdateFestivalEditionMutation();
  const isPending = mutation.isPending;

  function setLevel(next: RevealLevel) {
    mutation.mutate({
      editionId,
      editionData: { schedule_reveal_level: next },
    });
  }

  const advance = level === "full" ? null : NEXT[level];
  const previous = level === "draft" ? null : PREVIOUS[level];

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="inline-flex h-9 items-center gap-1 rounded-md bg-purple-100 text-purple-900 px-3 text-sm font-medium">
        {level === "full" && <Check className="h-3 w-3" />}
        {STATUS_LABEL[level]}
      </span>
      {advance && (
        <Button
          size="sm"
          variant="outline"
          disabled={isPending}
          onClick={() => setLevel(advance)}
        >
          {ADVANCE_LABEL[level as Exclude<RevealLevel, "full">]}
        </Button>
      )}
      {previous && (
        <Button
          size="sm"
          variant="ghost"
          disabled={isPending}
          onClick={() => setLevel(previous)}
          title={`Demote to ${previous}`}
        >
          <Undo2 className="h-3 w-3" />
        </Button>
      )}
      {!editionPublished && level !== "draft" && (
        <p className="basis-full text-xs text-muted-foreground">
          Configured but not active — edition is not published.
        </p>
      )}
    </div>
  );
}
