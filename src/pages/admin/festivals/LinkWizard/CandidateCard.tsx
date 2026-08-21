import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users } from "lucide-react";
import type { Candidate } from "@/api/artistSearch/types";

interface CandidateCardProps {
  candidate: Candidate;
  onSelect: (candidate: Candidate) => void;
}

export function CandidateCard({ candidate, onSelect }: CandidateCardProps) {
  return (
    <Card className="p-3">
      <div className="space-y-2">
        {candidate.imageUrl && (
          <img
            src={candidate.imageUrl}
            alt={candidate.name}
            className="w-full h-24 object-cover rounded"
          />
        )}
        <div>
          <p className="font-medium text-sm line-clamp-2">{candidate.name}</p>
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
          type="button"
          size="sm"
          className="w-full mt-2"
          onClick={() => onSelect(candidate)}
        >
          Select
        </Button>
      </div>
    </Card>
  );
}

function formatFollowers(followers: number): string {
  return followers < 1000
    ? followers.toString()
    : `${(followers / 1000).toFixed(1)}k`;
}
