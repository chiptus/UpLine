import type { UseFormReturn } from "react-hook-form";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Download } from "lucide-react";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import type { LinkStepData } from "./LinkWizardStep";
import { useFetchArtistByUrlMutation } from "@/api/artistSearch/useFetchArtistByUrlMutation";
import type { Candidate, Provider } from "@/api/artistSearch/types";
import type { SelectableField } from "@/api/artistSearch/mergeCandidateSelection";
import { CandidateCard } from "./CandidateCard";

type ProviderUrlFieldName = "providerUrl.spotify" | "providerUrl.soundcloud";

interface ProviderUrlFieldProps {
  form: UseFormReturn<LinkStepData>;
  fieldName: ProviderUrlFieldName;
  label: string;
  placeholder: string;
  provider: Provider;
  onSelectCandidate: (
    candidate: Candidate,
    provider: Provider,
    fields: SelectableField[],
  ) => void;
}

export function ProviderUrlField({
  form,
  fieldName,
  label,
  placeholder,
  provider,
  onSelectCandidate,
}: ProviderUrlFieldProps) {
  const fetchMutation = useFetchArtistByUrlMutation();
  const [fetchedCandidate, setFetchedCandidate] = useState<Candidate | null>(
    null,
  );
  const isLoading = fetchMutation.isPending;

  function handleFetchFromUrl() {
    const url = form.getValues(fieldName);
    if (!url) {
      return;
    }

    form.clearErrors(fieldName);
    setFetchedCandidate(null);

    fetchMutation.mutate(
      { provider, url },
      {
        onSuccess: (response) => {
          if (response.error) {
            form.setError(fieldName, {
              type: "manual",
              message: response.error,
            });
            return;
          }

          if (!response.candidate) {
            form.setError(fieldName, {
              type: "manual",
              message: "Artist not found",
            });
            return;
          }

          setFetchedCandidate(response.candidate);
        },
        onError: (error) => {
          form.setError(fieldName, {
            type: "manual",
            message: error.message || "Failed to fetch artist",
          });
        },
      },
    );
  }

  return (
    <div className="space-y-1">
      <FormField
        control={form.control}
        name={fieldName}
        render={({ field }) => (
          <FormItem>
            <FormLabel>{label}</FormLabel>
            <div className="flex gap-2">
              <FormControl>
                <Input
                  type="url"
                  placeholder={placeholder}
                  value={field.value || ""}
                  onChange={(e) => {
                    field.onChange(e);
                    setFetchedCandidate(null);
                  }}
                  onBlur={field.onBlur}
                  name={field.name}
                  ref={field.ref}
                />
              </FormControl>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={handleFetchFromUrl}
                disabled={
                  !form.getValues(fieldName) ||
                  isLoading ||
                  !!form.formState.errors.providerUrl?.[provider]
                }
                title="Fetch artist metadata from URL"
                aria-label={`Fetch ${provider} artist metadata from URL`}
              >
                <Download className="h-4 w-4" />
              </Button>
            </div>
            <FormMessage />
          </FormItem>
        )}
      />
      {fetchedCandidate && (
        <div className="max-w-xs">
          <CandidateCard
            candidate={fetchedCandidate}
            onSelect={(candidate, fields) => {
              onSelectCandidate(candidate, provider, fields);
              setFetchedCandidate(null);
            }}
          />
        </div>
      )}
    </div>
  );
}
