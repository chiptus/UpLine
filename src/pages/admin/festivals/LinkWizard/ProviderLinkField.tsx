import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, RotateCcw } from "lucide-react";
import type { UseFormReturn } from "react-hook-form";
import type { Candidate, Provider } from "@/api/artistSearch/types";
import { CandidateCards } from "./CandidateCards";

interface ProviderLinkFieldProps {
  provider: Provider;
  fieldName: string;
  label: string;
  placeholder: string;
  candidates: Candidate[];
  searchError?: string | undefined;
  isLoadingCandidates: boolean;
  form: UseFormReturn<Record<string, unknown>>;
  onSelectCandidate: (candidate: Candidate) => void;
  onSearchAgain: (query: string) => void;
}

export function ProviderLinkField({
  provider,
  fieldName,
  label,
  placeholder,
  candidates,
  searchError,
  isLoadingCandidates,
  form,
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
      {searchError && !isLoadingCandidates && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{searchError}</AlertDescription>
        </Alert>
      )}
      <CandidateCards
        candidates={candidates}
        provider={provider}
        isLoading={isLoadingCandidates}
        onSelectCandidate={onSelectCandidate}
      />
      <FormField
        control={form.control}
        name={fieldName}
        render={({ field }) => (
          <FormItem>
            <div className="flex items-center justify-between">
              <FormLabel>{label}</FormLabel>
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
              <div className="flex gap-2 mb-2">
                <Input
                  type="text"
                  placeholder="Enter artist name..."
                  value={customSearchQuery}
                  onChange={(e) => setCustomSearchQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      handleCustomSearch();
                    }
                  }}
                  disabled={isLoadingCandidates}
                  autoFocus
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
            <FormControl>
              <Input
                type="url"
                placeholder={placeholder}
                value={(field.value as string) || ""}
                onChange={field.onChange}
                onBlur={field.onBlur}
                name={field.name}
                ref={field.ref}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
}
