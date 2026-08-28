import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { Artist } from "@/api/artists/types";
import type { ArtistWithSets } from "@/api/artists/useArtistsMissingLinksByEdition";
import {
  useUpdateArtistMutation,
  type UpdateArtistUpdates,
} from "@/api/artists/useUpdateArtist";
import {
  mergeCandidateSelection,
  type SelectableField,
} from "@/api/artistSearch/mergeCandidateSelection";
import type { Provider, Candidate } from "@/api/artistSearch/types";
import { useBackfillSetTypesMutation } from "@/api/sets/useBackfillSetTypes";
import type { SetType } from "@/api/sets/types";
import { ProviderCandidatesPanel } from "./ProviderCandidatesPanel";
import { StagedFieldsPreview } from "./StagedFieldsPreview";
import { ArtistSetInfoPanel } from "./ArtistSetInfoPanel";
import { UntypedSetsBlock } from "./UntypedSetsBlock";
import { useArtistBatchQuery } from "./useArtistBatchQuery";
import { validateProviderUrl } from "@/lib/validateProviderUrl";

const optionalUrlSchema = z
  .string()
  .url("Enter a valid URL")
  .optional()
  .or(z.literal(""));

const linkStepSchema = z.object({
  providerUrl: z
    .object({
      spotify: optionalUrlSchema,
      soundcloud: optionalUrlSchema,
    })
    .superRefine((value, ctx) => {
      if (value.spotify && !validateProviderUrl("spotify", value.spotify)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["spotify"],
          message: "Invalid spotify URL",
        });
      }
      if (
        value.soundcloud &&
        !validateProviderUrl("soundcloud", value.soundcloud)
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["soundcloud"],
          message: "Invalid soundcloud URL",
        });
      }
    }),
  image_url: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
});

export type LinkStepData = z.infer<typeof linkStepSchema>;

interface LinkWizardStepProps {
  artist: ArtistWithSets;
  position: number;
  total: number;
  artists: Artist[];
  onPrev: () => void;
  onNext: () => void;
  onSaveSuccess?: () => void;
}

export function LinkWizardStep({
  artist,
  position,
  total,
  artists,
  onPrev,
  onNext,
  onSaveSuccess,
}: LinkWizardStepProps) {
  const updateArtistMutation = useUpdateArtistMutation();
  const backfillMutation = useBackfillSetTypesMutation();
  const batchQueryResult = useArtistBatchQuery(artist, artists);

  const untypedSets = artist.sets.filter((set) => set.set_type === null);
  const [pendingTypes, setPendingTypes] = useState<Record<string, SetType>>({});
  const isSaving = updateArtistMutation.isPending || backfillMutation.isPending;

  const form = useForm<LinkStepData>({
    resolver: zodResolver(linkStepSchema),
    mode: "onChange",
    defaultValues: {
      providerUrl: {
        spotify: artist.spotify_url ?? "",
        soundcloud: artist.soundcloud_url ?? "",
      },
      image_url: artist.image_url ?? undefined,
      description: artist.description ?? undefined,
    },
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-end">
        <span className="text-sm text-muted-foreground">
          {position} of {total}
        </span>
      </div>

      <ArtistSetInfoPanel artist={artist} />

      {untypedSets.length > 0 && (
        <UntypedSetsBlock
          untypedSets={untypedSets}
          pendingTypes={pendingTypes}
          onPick={(setId, setType) =>
            setPendingTypes((prev) => ({ ...prev, [setId]: setType }))
          }
        />
      )}

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          {!artist.spotify_url && (
            <ProviderCandidatesPanel
              provider="spotify"
              label="Spotify Candidates"
              artistName={artist.name}
              batchQueryResult={batchQueryResult}
              onSelectCandidate={(candidate, fields) =>
                handleCandidateSelect(candidate, "spotify", fields)
              }
            />
          )}

          {!artist.soundcloud_url && (
            <ProviderCandidatesPanel
              provider="soundcloud"
              label="SoundCloud Candidates"
              artistName={artist.name}
              batchQueryResult={batchQueryResult}
              onSelectCandidate={(candidate, fields) =>
                handleCandidateSelect(candidate, "soundcloud", fields)
              }
            />
          )}

          <StagedFieldsPreview
            form={form}
            onSelectCandidate={handleCandidateSelect}
          />

          <div className="flex items-center justify-between gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={onPrev}
              disabled={position <= 1 || isSaving}
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Previous
            </Button>

            <div className="flex gap-2">
              <Button
                type="button"
                variant="ghost"
                onClick={onNext}
                disabled={isSaving}
              >
                Skip
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
              <Button type="submit" disabled={isSaving}>
                {isSaving ? "Saving..." : "Save & Next"}
              </Button>
            </div>
          </div>
        </form>
      </Form>
    </div>
  );

  function handleCandidateSelect(
    candidate: Candidate,
    provider: Provider,
    fields: SelectableField[],
  ) {
    const update = mergeCandidateSelection(candidate, provider, fields, {
      image_url: form.getValues("image_url"),
      description: form.getValues("description"),
    });

    if (update.providerUrl) {
      for (const [providerKey, url] of Object.entries(update.providerUrl)) {
        form.setValue(
          `providerUrl.${providerKey}` as
            | "providerUrl.spotify"
            | "providerUrl.soundcloud",
          url,
          { shouldDirty: true },
        );
      }
    }

    if (update.image_url !== undefined) {
      form.setValue("image_url", update.image_url, { shouldDirty: true });
    }
    if (update.description !== undefined) {
      form.setValue("description", update.description, {
        shouldDirty: true,
      });
    }
  }

  // The picked types must persist before the step advances — the artist save
  // alone drives advancement, so a fire-and-forget backfill would silently
  // drop the picks when it fails.
  function onSubmit(data: LinkStepData) {
    const typeUpdates = Object.entries(pendingTypes).map(([id, set_type]) => ({
      id,
      set_type,
    }));
    if (typeUpdates.length > 0) {
      backfillMutation.mutate(
        { updates: typeUpdates },
        { onSuccess: () => saveArtist(data) },
      );
    } else {
      saveArtist(data);
    }
  }

  function saveArtist(data: LinkStepData) {
    const updates: UpdateArtistUpdates = {
      spotify_url: data.providerUrl.spotify || null,
      soundcloud_url: data.providerUrl.soundcloud || null,
    };

    if (data.image_url) {
      updates.image_url = data.image_url;
    }
    if (data.description !== undefined) {
      updates.description = data.description;
    }

    updateArtistMutation.mutate(
      { id: artist.id, updates },
      {
        onSuccess: () => {
          if (onSaveSuccess) {
            onSaveSuccess();
          } else {
            onNext();
          }
        },
      },
    );
  }
}
