import { useEffect, useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import type { Candidate } from "@/api/artistSearch/types";
import type { SelectableField } from "@/api/artistSearch/mergeCandidateSelection";
import { CandidateCard } from "./CandidateCard";

interface CandidateCardsProps {
  candidates: Candidate[];
  isLoading: boolean;
  label: string;
  onSelectCandidate: (candidate: Candidate, fields: SelectableField[]) => void;
}

export function CandidateCards({
  candidates,
  isLoading,
  label,
  onSelectCandidate,
}: CandidateCardsProps) {
  const [showMore, setShowMore] = useState(false);

  useEffect(() => {
    setShowMore(false);
  }, [candidates]);

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-40 rounded-lg" />
        ))}
      </div>
    );
  }

  if (candidates.length === 0) {
    return null;
  }

  const sortedCandidates = sortCandidatesByFollowers(candidates);
  const displayedCandidates = showMore
    ? sortedCandidates
    : sortedCandidates.slice(0, 3);
  const hasMore = sortedCandidates.length > 3;

  return (
    <div className="space-y-3">
      <div
        className="grid grid-cols-1 md:grid-cols-3 gap-3"
        role="list"
        aria-label={label}
      >
        {displayedCandidates.map((candidate) => (
          <CandidateCard
            key={candidate.url}
            candidate={candidate}
            onSelect={onSelectCandidate}
          />
        ))}
      </div>
      {hasMore && !showMore && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setShowMore(true)}
        >
          Show more
        </Button>
      )}
    </div>
  );
}

function sortCandidatesByFollowers(candidates: Candidate[]): Candidate[] {
  return [...candidates].sort((a, b) => {
    if (a.followers === null && b.followers === null) return 0;
    if (a.followers === null) return 1;
    if (b.followers === null) return -1;
    return b.followers - a.followers;
  });
}
