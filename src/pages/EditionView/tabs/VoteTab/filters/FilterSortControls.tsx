import { useState, useEffect } from "react";
import { useSuspenseQuery } from "@tanstack/react-query";
import type { SortOption, FilterSortState } from "@/hooks/useUrlState";
import { genresQuery } from "@/api/genres/useGenres";
import { SortControls } from "./SortControls";
import { MobileFilters } from "./MobileFilters";
import { DesktopFilters } from "./DesktopFilters";
import { VotePerspectiveToggle } from "./VotePerspectiveToggle";
import { FilterToggle } from "@/components/filters/FilterToggle";
import { FilterContainer } from "@/components/filters/FilterContainer";
import { RefreshButton } from "./RefreshButton";
import type { BinaryVoteScope } from "@/lib/voteScope";

interface VotePerspectiveProps {
  scope: BinaryVoteScope;
  onScopeChange: (scope: BinaryVoteScope) => void;
  groupName: string;
}

interface FilterSortControlsProps {
  state: FilterSortState;
  onStateChange: (updates: Partial<FilterSortState>) => void;
  onClear: () => void;
  editionId: string;
  votePerspective?: VotePerspectiveProps | undefined;
}

export function FilterSortControls({
  state,
  onStateChange,
  onClear,
  editionId,
  votePerspective,
}: FilterSortControlsProps) {
  const [isFiltersExpanded, setIsFiltersExpanded] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const { data: genres } = useSuspenseQuery(genresQuery());

  useEffect(() => {
    function checkMobile() {
      setIsMobile(window.innerWidth < 768);
    }

    checkMobile();
    window.addEventListener("resize", checkMobile);

    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  function handleSortChange(sort: SortOption) {
    onStateChange({ sort, sortLocked: false });
  }

  function handleRefreshRankings() {
    onStateChange({ sortLocked: false });
  }

  const hasActiveFilters =
    state.stages.length > 0 || state.genres.length > 0 || state.minRating > 0;
  const activeFilterCount =
    state.stages.length + state.genres.length + (state.minRating > 0 ? 1 : 0);

  const Filters = isMobile ? MobileFilters : DesktopFilters;

  return (
    <div className="space-y-4">
      <FilterContainer>
        <div className="flex items-center gap-2">
          <SortControls sort={state.sort} onSortChange={handleSortChange} />

          {state.sortLocked && (
            <RefreshButton onRefresh={handleRefreshRankings} />
          )}

          <div className="ml-auto" />
          {votePerspective && (
            <VotePerspectiveToggle
              scope={votePerspective.scope}
              onScopeChange={votePerspective.onScopeChange}
              groupName={votePerspective.groupName}
            />
          )}
          <FilterToggle
            isExpanded={isFiltersExpanded}
            onToggle={() => setIsFiltersExpanded(!isFiltersExpanded)}
            hasActiveFilters={hasActiveFilters}
            activeFilterCount={activeFilterCount}
            onClearFilters={hasActiveFilters ? onClear : undefined}
          />
        </div>
      </FilterContainer>

      {isFiltersExpanded && (
        <FilterContainer>
          <Filters
            state={state}
            genres={genres}
            onStateChange={onStateChange}
            editionId={editionId}
          />
        </FilterContainer>
      )}
    </div>
  );
}
