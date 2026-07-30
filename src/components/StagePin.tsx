import { useSuspenseQuery } from "@tanstack/react-query";
import { MapPin } from "lucide-react";
import { stagesByEditionQuery } from "@/api/stages/useStagesByEdition";

export function StagePin({
  stageId,
  editionId,
}: {
  stageId: string | null;
  editionId: string;
}) {
  const { data: stages } = useSuspenseQuery(stagesByEditionQuery(editionId));
  const stage = stages.find((s) => s.id === stageId);
  return stage ? (
    <div className="flex items-center gap-2">
      <MapPin className="h-4 w-4" />
      <span className="text-sm">{stage.name}</span>
    </div>
  ) : null;
}
