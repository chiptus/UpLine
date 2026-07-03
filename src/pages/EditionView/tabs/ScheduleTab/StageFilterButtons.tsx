import { Button } from "@/components/ui/button";
import { MapPin } from "lucide-react";
import { useStagesByEditionQuery } from "@/api/stages/useStagesByEdition";
import { useFestivalEdition } from "@/contexts/FestivalEditionContext";

interface StageFilterButtonsProps {
  selectedStages: string[];
  onStageToggle: (stageId: string) => void;
}

export function StageFilterButtons({
  selectedStages,
  onStageToggle,
}: StageFilterButtonsProps) {
  const { edition } = useFestivalEdition();
  const { data: stages = [] } = useStagesByEditionQuery(edition?.id);

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <MapPin className="h-3 w-3 text-purple-300" />
        <label className="text-sm font-medium text-purple-200">Stages</label>
      </div>
      <div className="flex flex-wrap gap-2 max-h-20 overflow-y-auto">
        {stages.map((stage) => (
          <Button
            key={stage.id}
            variant={selectedStages.includes(stage.id) ? "default" : "outline"}
            size="sm"
            onClick={() => onStageToggle(stage.id)}
            className={
              selectedStages.includes(stage.id)
                ? "bg-purple-600 hover:bg-purple-700 text-xs"
                : "border-purple-400 text-purple-400 hover:bg-purple-400 hover:text-white text-xs"
            }
          >
            {stage.name}
          </Button>
        ))}
      </div>
    </div>
  );
}
