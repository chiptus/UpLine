import { Skeleton } from "@/components/ui/skeleton";
import type { Candidate } from "@/api/artistSearch/types";
import type { SelectableField } from "@/api/artistSearch/mergeCandidateSelection";
import { CandidateCard } from "./CandidateCard";

interface CandidateCardsProps {
  candidates: Candidate[];
  isLoading: boolean;
  onSelectCandidate: (candidate: Candidate, fields: SelectableField[]) => void;
}

export function CandidateCards({
  candidates,
  isLoading,
  onSelectCandidate,
}: CandidateCardsProps) {
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

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
      {candidates.slice(0, 3).map((candidate) => (
        <CandidateCard
          key={candidate.url}
          candidate={candidate}
          onSelect={onSelectCandidate}
        />
      ))}
    </div>
  );
}
