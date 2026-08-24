import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { FilterSortState } from "@/hooks/useUrlState";
import { useStagesByEditionQuery } from "@/api/stages/useStagesByEdition";
import { useScheduleReveal } from "@/hooks/useScheduleReveal";

interface MobileFiltersProps {
  state: FilterSortState;
  genres: Array<{ id: string; name: string }>;
  onStateChange: (updates: Partial<FilterSortState>) => void;
  editionId: string;
}

export function MobileFilters({
  state,
  genres,
  onStateChange,
  editionId,
}: MobileFiltersProps) {
  const { canShowStage } = useScheduleReveal();
  const { data: stages = [], isLoading: stagesLoading } =
    useStagesByEditionQuery(editionId);

  function handleStageSelect(value: string) {
    if (value === "all") {
      onStateChange({ stages: [] });
    } else {
      onStateChange({ stages: [value] });
    }
  }

  function handleGenreSelect(value: string) {
    if (value === "all") {
      onStateChange({ genres: [] });
    } else {
      onStateChange({ genres: [value] });
    }
  }

  return (
    <div className="space-y-4">
      {/* Stage Filter Select */}
      {canShowStage && (
        <div>
          <h4 className="text-sm font-medium text-muted-foreground mb-2">
            Stage
          </h4>
          <Select
            value={state.stages.length === 1 ? state.stages[0] : "all"}
            onValueChange={handleStageSelect}
          >
            <SelectTrigger className="w-full bg-surface-raised border-border text-popover-foreground">
              <SelectValue placeholder="All Stages" />
            </SelectTrigger>
            <SelectContent className="bg-popover border">
              <SelectItem value="all" className="text-popover-foreground">
                All Stages
              </SelectItem>
              {stagesLoading ? (
                <SelectItem
                  value="loading"
                  disabled
                  className="text-subtle-foreground"
                >
                  Loading stages...
                </SelectItem>
              ) : (
                stages.map((stage) => (
                  <SelectItem
                    key={stage.id}
                    value={stage.id}
                    className="text-popover-foreground"
                  >
                    {stage.name}
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Genre Filter Select */}
      <div>
        <h4 className="text-sm font-medium text-muted-foreground mb-2">
          Genre
        </h4>
        <Select
          value={state.genres.length === 1 ? state.genres[0] : "all"}
          onValueChange={handleGenreSelect}
        >
          <SelectTrigger className="w-full bg-surface-raised border-border text-popover-foreground">
            <SelectValue placeholder="All Genres" />
          </SelectTrigger>
          <SelectContent className="bg-popover border">
            <SelectItem value="all" className="text-popover-foreground">
              All Genres
            </SelectItem>
            {genres.map((genre) => (
              <SelectItem
                key={genre.id}
                value={genre.id}
                className="text-popover-foreground"
              >
                {genre.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Rating Filter */}
      <div>
        <h4 className="text-sm font-medium text-muted-foreground mb-2">
          Minimum Rating
        </h4>
        <Select
          value={state.minRating.toString()}
          onValueChange={(value) =>
            onStateChange({ minRating: parseInt(value) })
          }
        >
          <SelectTrigger className="w-full bg-surface-raised border-border text-popover-foreground">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-popover border">
            <SelectItem value="0" className="text-popover-foreground">
              Any Rating
            </SelectItem>
            <SelectItem value="1" className="text-popover-foreground">
              1+ Rating
            </SelectItem>
            <SelectItem value="2" className="text-popover-foreground">
              2+ Rating
            </SelectItem>
            <SelectItem value="3" className="text-popover-foreground">
              3+ Rating
            </SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
