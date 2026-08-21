import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, RotateCcw } from "lucide-react";
import type { Candidate } from "@/api/artistSearch/types";
import type { SelectableField } from "@/api/artistSearch/mergeCandidateSelection";
import { CandidateCards } from "./CandidateCards";

interface ProviderLinkFieldProps {
  label: string;
  candidates: Candidate[];
  searchError?: string | undefined;
  isLoadingCandidates: boolean;
  onSelectCandidate: (candidate: Candidate, fields: SelectableField[]) => void;
  onSearchAgain: (query: string) => void;
}

export function ProviderLinkField({
  label,
  candidates,
  searchError,
  isLoadingCandidates,
  onSelectCandidate,
  onSearchAgain,
}: ProviderLinkFieldProps) {
  const [showCustomSearch, setShowCustomSearch] = useState(false);
  const [customSearchQuery, setCustomSearchQuery] = useState("");

  function handleSearchClick() {
    setShowCustomSearch(!showCustomSearch);
  }

  function handleCustomSearch() {
    if (customSearchQuery.trim()) {
      onSearchAgain(customSearchQuery);
      setCustomSearchQuery("");
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
          disabled={isLoadingCandidates}
        >
          <RotateCcw className="h-3 w-3 mr-1" />
          Search Again
        </Button>
      </div>

      {showCustomSearch && (
        <div className="flex gap-2">
          <Input
            type="text"
            placeholder="Enter artist name..."
            value={customSearchQuery}
            onChange={(e) => setCustomSearchQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleCustomSearch();
              }
            }}
            disabled={isLoadingCandidates}
          />
          <Button
            type="button"
            size="sm"
            onClick={handleCustomSearch}
            disabled={!customSearchQuery.trim() || isLoadingCandidates}
          >
            Search
          </Button>
        </div>
      )}

      {searchError && !isLoadingCandidates && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{searchError}</AlertDescription>
        </Alert>
      )}

      <CandidateCards
        candidates={candidates}
        isLoading={isLoadingCandidates}
        onSelectCandidate={onSelectCandidate}
      />
    </div>
  );
}
