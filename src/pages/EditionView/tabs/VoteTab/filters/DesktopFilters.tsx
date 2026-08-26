import { Button } from "@/components/ui/button";
import type { FilterSortState } from "@/hooks/useUrlState";
import { useStagesByEditionQuery } from "@/api/stages/useStagesByEdition";
import { useScheduleReveal } from "@/hooks/useScheduleReveal";

interface DesktopFiltersProps {
  state: FilterSortState;
  genres: Array<{ id: string; name: string }>;
  onStateChange: (updates: Partial<FilterSortState>) => void;
  editionId: string;
}

export function DesktopFilters({
  state,
  genres,
  onStateChange,
  editionId,
}: DesktopFiltersProps) {
  const { canShowStage } = useScheduleReveal();
  const { data: stages = [], isLoading: stagesLoading } =
    useStagesByEditionQuery(editionId);

  function handleStageToggle(stageId: string) {
    const newStages = state.stagesIds.includes(stageId)
      ? state.stagesIds.filter((s) => s !== stageId)
      : [...state.stagesIds, stageId];
    onStateChange({ stagesIds: newStages });
  }

  function handleGenreToggle(genreId: string) {
    const newGenres = state.genres.includes(genreId)
      ? state.genres.filter((g) => g !== genreId)
      : [...state.genres, genreId];
    onStateChange({ genres: newGenres });
  }

  return (
    <div className="space-y-4">
      {/* Stage Filter */}
      {canShowStage && (
        <div>
          <h4 className="text-sm font-medium text-muted-foreground mb-2">
            Stages
          </h4>
          <div className="flex flex-wrap gap-2">
            {stagesLoading ? (
              <div className="text-sm text-subtle-foreground">
                Loading stages...
              </div>
            ) : (
              stages.map((stage) => (
                <Button
                  key={stage.id}
                  variant={
                    state.stagesIds.includes(stage.id) ? "default" : "outline"
                  }
                  size="sm"
                  onClick={() => handleStageToggle(stage.id)}
                  className={
                    state.stagesIds.includes(stage.id)
                      ? "bg-accent text-accent-foreground hover:bg-accent-hover"
                      : "border-ring text-ring hover:bg-ring hover:text-foreground"
                  }
                >
                  {stage.name}
                </Button>
              ))
            )}
          </div>
        </div>
      )}

      {/* Genre Filter */}
      <div>
        <h4 className="text-sm font-medium text-muted-foreground mb-2">
          Genres
        </h4>
        <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
          {genres.map((genre) => (
            <Button
              key={genre.id}
              variant={state.genres.includes(genre.id) ? "default" : "outline"}
              size="sm"
              onClick={() => handleGenreToggle(genre.id)}
              className={
                state.genres.includes(genre.id)
                  ? "bg-accent text-accent-foreground hover:bg-accent-hover"
                  : "border-ring text-ring hover:bg-ring hover:text-foreground"
              }
            >
              {genre.name}
            </Button>
          ))}
        </div>
      </div>

      {/* Rating Filter */}
      <div>
        <h4 className="text-sm font-medium text-muted-foreground mb-2">
          Minimum Rating
        </h4>
        <div className="flex gap-2">
          {[0, 1, 2, 3].map((rating) => (
            <Button
              key={rating}
              variant={state.minRating === rating ? "default" : "outline"}
              size="sm"
              onClick={() => onStateChange({ minRating: rating })}
              className={
                state.minRating === rating
                  ? "bg-accent text-accent-foreground hover:bg-accent-hover"
                  : "border-ring text-ring hover:bg-ring hover:text-foreground"
              }
            >
              {rating === 0 ? "Any" : `${rating}+`}
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
}
