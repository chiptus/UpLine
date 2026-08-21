import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { Artist } from "@/api/artists/types";
import {
  useUpdateArtistMutation,
  type UpdateArtistUpdates,
} from "@/api/artists/useUpdateArtist";
import { useSearchArtistLinksQuery } from "@/api/artistSearch/useSearchArtistLinksQuery";
import {
  mergeCandidateSelection,
  type CandidateUpdate,
  type SelectableField,
} from "@/api/artistSearch/mergeCandidateSelection";
import type { Provider, Candidate } from "@/api/artistSearch/types";
import { ProviderLinkField } from "./ProviderLinkField";
import { StagedFieldsPreview } from "./StagedFieldsPreview";
import { useProviderCandidates } from "./useProviderCandidates";

const optionalUrlSchema = z
  .string()
  .url("Enter a valid URL")
  .optional()
  .or(z.literal(""));

const linkStepSchema = z.object({
  spotifyUrl: optionalUrlSchema,
  soundcloudUrl: optionalUrlSchema,
});

type LinkStepData = z.infer<typeof linkStepSchema>;

interface LinkWizardStepProps {
  artist: Artist;
  position: number;
  total: number;
  artists: Artist[];
  onPrev: () => void;
  onNext: () => void;
}

export function LinkWizardStep({
  artist,
  position,
  total,
  artists,
  onPrev,
  onNext,
}: LinkWizardStepProps) {
  const updateArtistMutation = useUpdateArtistMutation();
  const [stagedUpdates, setStagedUpdates] = useState<CandidateUpdate>({});

  const currentIndex = artists.findIndex((a) => a.id === artist.id);
  const batchStart = Math.floor(currentIndex / 10) * 10;
  const batchArtists = artists
    .slice(batchStart, batchStart + 10)
    .map((a) => a.name);

  const batchQueryResult = useSearchArtistLinksQuery(batchArtists);

  const spotify = useProviderCandidates(
    "spotify",
    artist.name,
    batchQueryResult,
  );
  const soundcloud = useProviderCandidates(
    "soundcloud",
    artist.name,
    batchQueryResult,
  );

  const form = useForm<LinkStepData>({
    resolver: zodResolver(linkStepSchema),
    defaultValues: {
      spotifyUrl: artist.spotify_url ?? "",
      soundcloudUrl: artist.soundcloud_url ?? "",
    },
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-end">
        <span className="text-sm text-muted-foreground">
          {position} of {total}
        </span>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          {!artist.spotify_url && (
            <ProviderLinkField
              provider="spotify"
              fieldName="spotifyUrl"
              label="Spotify URL"
              placeholder="https://open.spotify.com/artist/..."
              candidates={spotify.candidates}
              searchError={spotify.error}
              isLoadingCandidates={spotify.isLoading}
              form={form}
              onSelectCandidate={(candidate, fields) =>
                handleCandidateSelect(candidate, "spotify", fields)
              }
              onSearchAgain={spotify.search}
            />
          )}

          {!artist.soundcloud_url && (
            <ProviderLinkField
              provider="soundcloud"
              fieldName="soundcloudUrl"
              label="SoundCloud URL"
              placeholder="https://soundcloud.com/..."
              candidates={soundcloud.candidates}
              searchError={soundcloud.error}
              isLoadingCandidates={soundcloud.isLoading}
              form={form}
              onSelectCandidate={(candidate, fields) =>
                handleCandidateSelect(candidate, "soundcloud", fields)
              }
              onSearchAgain={soundcloud.search}
            />
          )}

          <StagedFieldsPreview
            stagedUpdates={stagedUpdates}
            onDescriptionChange={(description) =>
              setStagedUpdates((prev) => ({ ...prev, description }))
            }
          />

          <div className="flex items-center justify-between gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={onPrev}
              disabled={position <= 1 || updateArtistMutation.isPending}
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Previous
            </Button>

            <div className="flex gap-2">
              <Button
                type="button"
                variant="ghost"
                onClick={onNext}
                disabled={updateArtistMutation.isPending}
              >
                Skip
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
              <Button type="submit" disabled={updateArtistMutation.isPending}>
                {updateArtistMutation.isPending ? "Saving..." : "Save & Next"}
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
    const update = mergeCandidateSelection(candidate, provider, fields);

    setStagedUpdates((prev) => ({ ...prev, ...update }));

    if (provider === "spotify" && update.spotify_url) {
      form.setValue("spotifyUrl", update.spotify_url);
    } else if (provider === "soundcloud" && update.soundcloud_url) {
      form.setValue("soundcloudUrl", update.soundcloud_url);
    }
  }

  function onSubmit(data: LinkStepData) {
    const updates: UpdateArtistUpdates = {};

    if (!artist.spotify_url) {
      updates.spotify_url = data.spotifyUrl || null;
    }
    if (!artist.soundcloud_url) {
      updates.soundcloud_url = data.soundcloudUrl || null;
    }
    if (stagedUpdates.image_url) {
      updates.image_url = stagedUpdates.image_url;
    }
    if (stagedUpdates.description !== undefined) {
      updates.description = stagedUpdates.description;
    }

    updateArtistMutation.mutate(
      { id: artist.id, updates },
      { onSuccess: onNext },
    );
  }
}
