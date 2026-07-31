import { MapPin } from "lucide-react";
import { useStageQuery } from "@/api/stages/useStageQuery";

export function StagePin({ stageId }: { stageId: string | null }) {
  if (!stageId) return null;
  return <StagePinContent stageId={stageId} />;
}

function StagePinContent({ stageId }: { stageId: string }) {
  const { data: stage } = useStageQuery(stageId);
  return stage ? (
    <div className="flex items-center gap-2">
      <MapPin className="h-4 w-4" />
      <span className="text-sm">{stage.name}</span>
    </div>
  ) : null;
}
