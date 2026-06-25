import { useStageQuery } from "@/api/stages/useStageQuery";
import { MapPin } from "lucide-react";

export function StagePin({ stageId }: { stageId: string | null }) {
  const stageQuery = useStageQuery(stageId);
  return stageQuery.data ? (
    <div className="flex items-center gap-2">
      <MapPin className="h-4 w-4" />
      <span className="text-sm">{stageQuery.data.name}</span>
    </div>
  ) : null;
}
