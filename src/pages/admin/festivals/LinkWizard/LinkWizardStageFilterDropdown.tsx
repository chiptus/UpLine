import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MapPin } from "lucide-react";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useRouteContext } from "@tanstack/react-router";
import { stagesByEditionQuery } from "@/api/stages/useStagesByEdition";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

interface LinkWizardStageFilterDropdownProps {
  selectedStages: string[];
  onStageToggle: (stageId: string) => void;
  onClearStages: () => void;
}

export function LinkWizardStageFilterDropdown({
  selectedStages,
  onStageToggle,
  onClearStages,
}: LinkWizardStageFilterDropdownProps) {
  const { edition } = useRouteContext({
    from: "/admin/festivals/$festivalSlug/editions/$editionSlug/links",
  });
  const { data: stages } = useSuspenseQuery(stagesByEditionQuery(edition.id));

  const hasActiveFilters = selectedStages.length > 0;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="sm"
          aria-label={
            hasActiveFilters
              ? `Stages (${selectedStages.length} selected)`
              : "Filter by stage"
          }
          className={cn(
            "flex items-center gap-2",
            hasActiveFilters
              ? "bg-accent-soft text-foreground hover:bg-accent/60"
              : "bg-surface border-strong text-subtle-foreground hover:border-subtle-foreground hover:bg-accent-soft hover:text-foreground",
          )}
        >
          <MapPin className="h-3 w-3" />
          Stages
          {hasActiveFilters && (
            <Badge
              variant="secondary"
              className="bg-accent-soft text-foreground"
            >
              {selectedStages.length}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-56">
        <DropdownMenuLabel>Filter by stage</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <div className="max-h-64 overflow-y-auto">
          {stages.map((stage) => (
            <DropdownMenuCheckboxItem
              key={stage.id}
              checked={selectedStages.includes(stage.id)}
              onSelect={(event) => event.preventDefault()}
              onCheckedChange={() => onStageToggle(stage.id)}
            >
              {stage.name}
            </DropdownMenuCheckboxItem>
          ))}
        </div>
        {hasActiveFilters && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onSelect={onClearStages}
              className="text-destructive"
            >
              Clear all
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
