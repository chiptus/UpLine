import { useState } from "react";
import type { UseFormReturn } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Download } from "lucide-react";
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

const URL_FIELDS: {
  fieldName: "providerUrl.spotify" | "providerUrl.soundcloud";
  label: string;
  placeholder: string;
  provider: Provider;
}[] = [
  {
    fieldName: "providerUrl.spotify",
    label: "Spotify URL",
    placeholder: "https://open.spotify.com/artist/...",
    provider: "spotify",
  },
  {
    fieldName: "providerUrl.soundcloud",
    label: "SoundCloud URL",
    placeholder: "https://soundcloud.com/...",
    provider: "soundcloud",
  },
];

interface StagedFieldsPreviewProps {
  form: UseFormReturn<LinkStepData>;
  onSelectCandidate: (
    candidate: Candidate,
    provider: Provider,
    fields: SelectableField[],
  ) => void;
}

export function StagedFieldsPreview({
  form,
  onSelectCandidate,
}: StagedFieldsPreviewProps) {
  const imageUrl = form.watch("image_url");
  const description = form.watch("description");
  const fetchMutation = useFetchArtistByUrlMutation();
  const [fetchErrors, setFetchErrors] = useState<Record<string, string>>({});
  const [fetchedCandidates, setFetchedCandidates] = useState<
    Record<string, Candidate>
  >({});

  function handleFetchFromUrl(
    fieldName: "providerUrl.spotify" | "providerUrl.soundcloud",
    provider: Provider,
  ) {
    const url = form.getValues(fieldName);
    if (!url) {
      return;
    }

    setFetchErrors(
      (prev) => ({ ...prev, [fieldName]: "" }) as Record<string, string>,
    );
    setFetchedCandidates((prev) => {
      const { [fieldName]: _removed, ...rest } = prev;
      return rest;
    });

    fetchMutation.mutate(
      { provider, url },
      {
        onSuccess: (response) => {
          if (response.error) {
            setFetchErrors(
              (prev) =>
                ({
                  ...prev,
                  [fieldName]: response.error || "Unknown error",
                }) as Record<string, string>,
            );
            return;
          }

          if (!response.candidate) {
            setFetchErrors(
              (prev) =>
                ({ ...prev, [fieldName]: "Artist not found" }) as Record<
                  string,
                  string
                >,
            );
            return;
          }

          setFetchedCandidates((prev) => ({
            ...prev,
            [fieldName]: response.candidate as Candidate,
          }));
        },
        onError: (error) => {
          setFetchErrors(
            (prev) =>
              ({
                ...prev,
                [fieldName]: error.message || "Failed to fetch artist",
              }) as Record<string, string>,
          );
        },
      },
    );
  }

  return (
    <div className="space-y-3 rounded-lg border p-3">
      <p className="text-sm font-medium">Staged</p>

      {URL_FIELDS.map(({ fieldName, label, placeholder, provider }) => {
        const error = fetchErrors[fieldName];
        const fetchedCandidate = fetchedCandidates[fieldName];
        const isLoading = fetchMutation.isPending;

        return (
          <div key={fieldName} className="space-y-1">
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
                          setFetchErrors((prev) => ({
                            ...prev,
                            [fieldName]: "",
                          }));
                          setFetchedCandidates((prev) => {
                            const { [fieldName]: _removed, ...rest } = prev;
                            return rest;
                          });
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
                      onClick={() => handleFetchFromUrl(fieldName, provider)}
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
            {error && (
              <Alert variant="destructive" className="py-2">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-xs">{error}</AlertDescription>
              </Alert>
            )}
            {fetchedCandidate && (
              <div className="max-w-xs">
                <CandidateCard
                  candidate={fetchedCandidate}
                  onSelect={(candidate, fields) => {
                    onSelectCandidate(candidate, provider, fields);
                    setFetchedCandidates((prev) => {
                      const { [fieldName]: _removed, ...rest } = prev;
                      return rest;
                    });
                  }}
                />
              </div>
            )}
          </div>
        );
      })}

      {(imageUrl || description !== undefined) && (
        <div className="flex items-start gap-3 text-sm">
          {imageUrl && (
            <img
              src={imageUrl}
              alt=""
              className="h-12 w-12 rounded object-cover"
            />
          )}
          <div className="flex-1 space-y-1">
            {description !== undefined && (
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea
                        value={field.value ?? ""}
                        onChange={field.onChange}
                        onBlur={field.onBlur}
                        name={field.name}
                        ref={field.ref}
                        rows={2}
                        className="text-sm"
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}
