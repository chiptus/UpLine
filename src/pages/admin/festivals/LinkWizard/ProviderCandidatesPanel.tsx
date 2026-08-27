import { useState } from "react";
import type { UseQueryResult } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, RotateCcw } from "lucide-react";
import type {
  Candidate,
  Provider,
  SearchResponse,
} from "@/api/artistSearch/types";
import type { SelectableField } from "@/api/artistSearch/mergeCandidateSelection";
import { CandidateCards } from "./CandidateCards";
import { useProviderCandidates } from "./useProviderCandidates";

interface ProviderCandidatesPanelProps {
  provider: Provider;
  label: string;
  artistName: string;
  batchQueryResult: UseQueryResult<SearchResponse>;
  onSelectCandidate: (candidate: Candidate, fields: SelectableField[]) => void;
}

export function ProviderCandidatesPanel({
  provider,
  label,
  artistName,
  batchQueryResult,
  onSelectCandidate,
}: ProviderCandidatesPanelProps) {
  const { candidates, error, isLoading, search } = useProviderCandidates(
    provider,
    artistName,
    batchQueryResult,
  );

  const [showCustomSearch, setShowCustomSearch] = useState(false);
  const [customSearchQuery, setCustomSearchQuery] = useState("");

  function handleSearchClick() {
    if (showCustomSearch) {
      setShowCustomSearch(false);
      setCustomSearchQuery("");
    } else {
      setShowCustomSearch(true);
      setCustomSearchQuery(artistName);
    }
  }

  function handleCustomSearch() {
    if (customSearchQuery.trim()) {
      search(customSearchQuery);
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium">{label}</p>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={handleSearchClick}
          disabled={isLoading}
        >
          <RotateCcw className="h-3 w-3 mr-1" />
          Custom search
        </Button>
      </div>

      {showCustomSearch && (
        <div className="flex gap-2">
          <Input
            type="text"
            aria-label={`Search ${label}`}
            placeholder="Enter artist name..."
            value={customSearchQuery}
            onChange={(e) => setCustomSearchQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleCustomSearch();
              }
            }}
            disabled={isLoading}
          />
          <Button
            type="button"
            size="sm"
            onClick={handleCustomSearch}
            disabled={!customSearchQuery.trim() || isLoading}
          >
            Search
          </Button>
        </div>
      )}

      {error && !isLoading && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <CandidateCards
        candidates={candidates}
        isLoading={isLoading}
        label={label}
        onSelectCandidate={onSelectCandidate}
      />
    </div>
  );
}
