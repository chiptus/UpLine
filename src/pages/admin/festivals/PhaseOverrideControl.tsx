import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useUpdateFestivalEditionMutation } from "@/api/editions/useUpdateFestivalEdition";
import type { FestivalPhase } from "@/lib/festivalPhase";

type Props = {
  editionId: string;
  override: FestivalPhase | null;
  derivedPhase: FestivalPhase;
};

const AUTOMATIC = "automatic";

const PHASE_LABEL: Record<FestivalPhase, string> = {
  "pre-schedule": "Pre-Schedule",
  planning: "Planning",
  live: "Live",
  "post-festival": "Post-Festival",
};

function isFestivalPhase(value: string): value is FestivalPhase {
  return value in PHASE_LABEL;
}

export function PhaseOverrideControl({
  editionId,
  override,
  derivedPhase,
}: Props) {
  const mutation = useUpdateFestivalEditionMutation();
  const isPending = mutation.isPending;

  function setOverride(phase: FestivalPhase | null) {
    mutation.mutate({
      editionId,
      editionData: { phase_override: phase },
    });
  }

  return (
    <Select
      value={override ?? AUTOMATIC}
      disabled={isPending}
      onValueChange={(value) => {
        if (value === AUTOMATIC) setOverride(null);
        else if (isFestivalPhase(value)) setOverride(value);
      }}
    >
      <SelectTrigger className="h-9 w-[180px]">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={AUTOMATIC}>
          Automatic ({PHASE_LABEL[derivedPhase]})
        </SelectItem>
        {Object.entries(PHASE_LABEL).map(([phase, label]) => (
          <SelectItem key={phase} value={phase}>
            {label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
