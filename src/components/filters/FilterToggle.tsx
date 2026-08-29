import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Filter, ChevronDown, ChevronUp, X } from "lucide-react";

interface FilterToggleProps {
  isExpanded: boolean;
  onToggle: () => void;
  hasActiveFilters: boolean;
  activeFilterCount: number;
  label?: string;
  onClearFilters?: (() => void) | undefined;
}

export function FilterToggle({
  isExpanded,
  onToggle,
  hasActiveFilters,
  activeFilterCount,
  label = "Filters",
  onClearFilters,
}: FilterToggleProps) {
  return (
    <div className="flex items-center gap-1">
      {hasActiveFilters && onClearFilters && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onClearFilters}
          className="text-red-400 hover:text-red-300 hover:bg-red-400/10"
        >
          <X className="h-3 w-3 mr-1" />
          <span className="sr-only sm:not-sr-only">Clear</span>
        </Button>
      )}

      <Button
        variant="ghost"
        size="sm"
        onClick={onToggle}
        className={`flex items-center gap-2 ${
          isExpanded
            ? "bg-surface-active text-foreground hover:bg-surface-active"
            : "text-muted-foreground hover:text-foreground"
        }`}
      >
        {hasActiveFilters && (
          <Badge
            variant="secondary"
            className="bg-accent-soft text-accent-soft-foreground ml-1"
          >
            {activeFilterCount}
          </Badge>
        )}
        <Filter className="h-4 w-4" />
        <span className="sr-only md:not-sr-only">{label}</span>
        {isExpanded ? (
          <ChevronUp className="h-4 w-4" />
        ) : (
          <ChevronDown className="h-4 w-4" />
        )}
      </Button>
    </div>
  );
}
