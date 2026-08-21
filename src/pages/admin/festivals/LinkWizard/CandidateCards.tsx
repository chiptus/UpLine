import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Users } from "lucide-react";
import type { Candidate } from "@/api/artistSearch/types";
import type { Provider } from "@/api/artistSearch/types";

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
          <Card key={candidate.url} className="p-3">
            <div className="space-y-2">
              {candidate.imageUrl && (
                <img
                  src={candidate.imageUrl}
                  alt={candidate.name}
                  className="w-full h-24 object-cover rounded"
                />
              )}
              <div>
                <p className="font-medium text-sm line-clamp-2">
                  {candidate.name}
                </p>
                {candidate.followers !== null && (
                  <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                    <Users className="h-3 w-3" />
                    {formatFollowers(candidate.followers)}
                  </div>
                )}
              </div>
              {candidate.genres.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {candidate.genres.slice(0, 2).map((genre) => (
                    <Badge key={genre} variant="secondary" className="text-xs">
                      {genre}
                    </Badge>
                  ))}
                  {candidate.genres.length > 2 && (
                    <Badge variant="secondary" className="text-xs">
                      +{candidate.genres.length - 2}
                    </Badge>
                  )}
                </div>
              )}
              <Button
                size="sm"
                className="w-full mt-2"
                onClick={() => onSelectCandidate(candidate)}
              >
                Select
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

function formatFollowers(followers: number): string {
  return followers < 1000
    ? followers.toString()
    : `${(followers / 1000).toFixed(1)}k`;
}
