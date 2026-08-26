import { Button } from "@/components/ui/button";
import { MapPin } from "lucide-react";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useRouteContext } from "@tanstack/react-router";
import { stagesByEditionQuery } from "@/api/stages/useStagesByEdition";

interface LinkWizardStageFilterButtonsProps {
  selectedStages: string[];
  onStageToggle: (stageId: string) => void;
}

export function LinkWizardStageFilterButtons({
  selectedStages,
  onStageToggle,
}: LinkWizardStageFilterButtonsProps) {
  const { edition } = useRouteContext({
    from: "/admin/festivals/$festivalSlug/editions/$editionSlug/links",
  });
  const { data: stages } = useSuspenseQuery(stagesByEditionQuery(edition.id));

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <MapPin className="h-3 w-3 text-subtle-foreground" />
        <span className="text-sm font-medium text-muted-foreground">
          Stages
        </span>
      </div>
      <div className="flex flex-wrap gap-2 max-h-20 overflow-y-auto">
        {stages.map((stage) => {
          const isSelected = selectedStages.includes(stage.id);
          return (
            <Button
              key={stage.id}
              type="button"
              variant={isSelected ? "default" : "outline"}
              size="sm"
              onClick={() => onStageToggle(stage.id)}
              aria-pressed={isSelected}
              className={
                isSelected
                  ? "bg-accent hover:bg-accent-hover text-xs"
                  : "bg-surface border-strong text-subtle-foreground hover:border-subtle-foreground hover:bg-accent-soft hover:text-foreground text-xs"
              }
            >
              {stage.name}
            </Button>
          );
        })}
      </div>
    </div>
  );
}
