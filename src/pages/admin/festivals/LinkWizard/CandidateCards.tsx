import { Skeleton } from "@/components/ui/skeleton";
import type { Candidate } from "@/api/artistSearch/types";
import type { Provider } from "@/api/artistSearch/types";
import { CandidateCard } from "./CandidateCard";

interface CandidateCardsProps {
  candidates: Candidate[];
  provider: Provider;
  isLoading: boolean;
  onSelectCandidate: (candidate: Candidate) => void;
}

export function CandidateCards({
  candidates,
  provider,
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
    <div className="space-y-2">
      <p className="text-sm font-medium">
        {provider === "spotify" ? "Spotify" : "SoundCloud"} Candidates
      </p>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {candidates.slice(0, 3).map((candidate) => (
          <CandidateCard
            key={candidate.url}
            candidate={candidate}
            onSelect={onSelectCandidate}
          />
        ))}
      </div>
    </div>
  );
}
