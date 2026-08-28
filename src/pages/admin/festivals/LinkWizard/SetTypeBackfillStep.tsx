import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ArtistSetWithCoPerformers } from "@/api/artists/useArtistsMissingLinksByEdition";
import { useBackfillSetTypesMutation } from "@/api/sets/useBackfillSetTypes";
import type { SetType } from "@/api/sets/types";
import { ArtistSetCard } from "./ArtistSetCard";
import { UntypedSetsBlock } from "./UntypedSetsBlock";

interface SetTypeBackfillStepProps {
  set: ArtistSetWithCoPerformers;
  position: number;
  total: number;
  onPrev: () => void;
  onNext: () => void;
  onSaveSuccess?: () => void;
}

export function SetTypeBackfillStep({
  set,
  position,
  total,
  onPrev,
  onNext,
  onSaveSuccess,
}: SetTypeBackfillStepProps) {
  const backfillMutation = useBackfillSetTypesMutation();
  const [pendingType, setPendingType] = useState<SetType | null>(null);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-end">
        <span className="text-sm text-muted-foreground">
          {position} of {total}
        </span>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">{set.name} - Set Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <ArtistSetCard set={set} />
        </CardContent>
      </Card>

      <UntypedSetsBlock
        untypedSets={[set]}
        pendingTypes={pendingType ? { [set.id]: pendingType } : {}}
        onPick={(_setId, setType) => setPendingType(setType)}
      />

      <div className="flex items-center justify-between gap-2 pt-2">
        <Button
          type="button"
          variant="outline"
          onClick={onPrev}
          disabled={position <= 1 || backfillMutation.isPending}
        >
          <ChevronLeft className="h-4 w-4 mr-1" />
          Previous
        </Button>

        <div className="flex gap-2">
          <Button
            type="button"
            variant="ghost"
            onClick={onNext}
            disabled={backfillMutation.isPending}
          >
            Skip
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
          <Button
            type="button"
            onClick={handleSave}
            disabled={!pendingType || backfillMutation.isPending}
          >
            {backfillMutation.isPending ? "Saving..." : "Save & Next"}
          </Button>
        </div>
      </div>
    </div>
  );

  function handleSave() {
    if (!pendingType) return;
    backfillMutation.mutate(
      { updates: [{ id: set.id, set_type: pendingType }] },
      { onSuccess: () => onSaveSuccess?.() },
    );
  }
}
