import { useSuspenseQuery } from "@tanstack/react-query";
import { useRouteContext } from "@tanstack/react-router";
import { MapPin } from "lucide-react";
import { stagesByEditionQuery } from "@/api/stages/useStagesByEdition";

export function StagePin({ stageId }: { stageId: string | null }) {
  const { edition } = useRouteContext({
    from: "/festivals/$festivalSlug/editions/$editionSlug",
  });
  const { data: stages } = useSuspenseQuery(stagesByEditionQuery(edition.id));
  const stage = stageId ? stages.find((s) => s.id === stageId) : undefined;
  return stage ? (
    <div className="flex items-center gap-2">
      <MapPin className="h-4 w-4" />
      <span className="text-sm">{stage.name}</span>
    </div>
  ) : null;
}
