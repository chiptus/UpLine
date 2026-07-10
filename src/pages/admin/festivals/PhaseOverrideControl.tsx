import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
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
};

const PHASE_LABEL: Record<FestivalPhase, string> = {
  "pre-schedule": "Pre-Schedule",
  planning: "Planning",
  live: "Live",
  "post-festival": "Post-Festival",
};

function isFestivalPhase(value: string): value is FestivalPhase {
  return value in PHASE_LABEL;
}

export function PhaseOverrideControl({ editionId, override }: Props) {
  const mutation = useUpdateFestivalEditionMutation();
  const isPending = mutation.isPending;

  function setOverride(phase: FestivalPhase | null) {
    mutation.mutate({
      editionId,
      editionData: { phase_override: phase },
    });
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Select
        value={override ?? undefined}
        disabled={isPending}
        onValueChange={(value) => {
          if (isFestivalPhase(value)) setOverride(value);
        }}
      >
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Phase: automatic" />
        </SelectTrigger>
        <SelectContent>
          {Object.entries(PHASE_LABEL).map(([phase, label]) => (
            <SelectItem key={phase} value={phase}>
              {label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {override && (
        <Button
          size="sm"
          variant="ghost"
          disabled={isPending}
          onClick={() => setOverride(null)}
          title="Clear override (return to automatic phase)"
        >
          <X className="h-3 w-3" />
          Clear override
        </Button>
      )}
    </div>
  );
}
