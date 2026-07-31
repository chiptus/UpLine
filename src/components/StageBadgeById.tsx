import { StageBadge } from "@/components/StageBadge";
import { useStageQuery } from "@/api/stages/useStageQuery";

export function StageBadgeById({ stageId }: { stageId: string }) {
  const { data: stage } = useStageQuery(stageId);
  return stage ? (
    <StageBadge
      stageName={stage.name}
      stageColor={stage.color || undefined}
      size="sm"
    />
  ) : null;
}
