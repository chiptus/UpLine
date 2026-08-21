import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users } from "lucide-react";
import type { Candidate } from "@/api/artistSearch/types";
import type { SelectableField } from "@/api/artistSearch/mergeCandidateSelection";

interface CandidateCardProps {
  candidate: Candidate;
  onSelect: (candidate: Candidate, fields: SelectableField[]) => void;
}

export function CandidateCard({ candidate, onSelect }: CandidateCardProps) {
  const availableFields: SelectableField[] = [
    "url",
    ...(candidate.imageUrl ? (["image"] as const) : []),
    ...(candidate.description ? (["description"] as const) : []),
  ];

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
          onClick={() => onSelect(candidate, availableFields)}
        >
          Select all
        </Button>
        <div className="flex gap-1">
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="flex-1"
            onClick={() => onSelect(candidate, ["url"])}
          >
            URL
          </Button>
          {candidate.imageUrl && (
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="flex-1"
              onClick={() => onSelect(candidate, ["image"])}
            >
              Image
            </Button>
          )}
          {candidate.description && (
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="flex-1"
              onClick={() => onSelect(candidate, ["description"])}
            >
              Description
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
}

function formatFollowers(followers: number): string {
  return followers < 1000
    ? followers.toString()
    : `${(followers / 1000).toFixed(1)}k`;
}
