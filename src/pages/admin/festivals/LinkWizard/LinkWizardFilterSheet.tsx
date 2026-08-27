import { useState } from "react";
import { Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { LinkWizardStageFilterButtons } from "./LinkWizardStageFilterButtons";

interface LinkWizardFilterSheetProps {
  selectedStages: string[];
  onStageToggle: (stageId: string) => void;
  onClearStages: () => void;
}

export function LinkWizardFilterSheet({
  selectedStages,
  onStageToggle,
  onClearStages,
}: LinkWizardFilterSheetProps) {
  const [open, setOpen] = useState(false);

  const hasActiveFilters = selectedStages.length > 0;

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          aria-label={
            hasActiveFilters
              ? `Filters (${selectedStages.length} active)`
              : "Filters"
          }
          className={cn(
            "flex items-center gap-2",
            hasActiveFilters
              ? "bg-accent-soft text-foreground hover:bg-accent/60"
              : "text-subtle-foreground hover:bg-accent-soft hover:text-foreground",
          )}
        >
          <Filter className="h-4 w-4" />
          <span className="hidden md:inline">Filters</span>
          {hasActiveFilters && (
            <Badge
              variant="secondary"
              className="bg-accent-soft text-foreground"
            >
              {selectedStages.length}
            </Badge>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent
        side="bottom"
        className="bg-popover border-border max-h-[85vh] overflow-y-auto"
      >
        <SheetHeader>
          <SheetTitle className="text-foreground">Filter queue</SheetTitle>
          <SheetDescription className="text-subtle-foreground">
            Narrow the queue by stage.
          </SheetDescription>
        </SheetHeader>

        <div className="mt-4">
          <LinkWizardStageFilterButtons
            selectedStages={selectedStages}
            onStageToggle={onStageToggle}
          />
        </div>

        <SheetFooter className="mt-6">
          {hasActiveFilters && (
            <Button
              type="button"
              variant="ghost"
              onClick={onClearStages}
              className="text-destructive hover:text-red-300 hover:bg-destructive/10"
            >
              Clear all
            </Button>
          )}
          <SheetClose asChild>
            <Button type="button" className="bg-accent hover:bg-accent-hover">
              Done
            </Button>
          </SheetClose>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
