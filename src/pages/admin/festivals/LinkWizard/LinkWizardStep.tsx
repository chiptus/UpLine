import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import type { UseQueryResult } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { Artist } from "@/api/artists/types";
import { useUpdateArtistMutation } from "@/api/artists/useUpdateArtist";
import { useSearchArtistLinksQuery } from "@/api/artistSearch/useSearchArtistLinksQuery";
import {
  mergeCandidateSelection,
  type CandidateUpdate,
} from "@/api/artistSearch/mergeCandidateSelection";
import type {
  Provider,
  Candidate,
  SearchResponse,
} from "@/api/artistSearch/types";
import { ProviderLinkField } from "./ProviderLinkField";

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
  const [customSpotifySearch, setCustomSpotifySearch] = useState("");
  const [customSoundcloudSearch, setCustomSoundcloudSearch] = useState("");

  const currentIndex = artists.findIndex((a) => a.id === artist.id);
  const batchStart = Math.floor(currentIndex / 10) * 10;
  const batchArtists = artists
    .slice(batchStart, batchStart + 10)
    .map((a) => a.name);

  const batchQueryResult = useSearchArtistLinksQuery(batchArtists);

  const spotifyCustomResult = useSearchArtistLinksQuery(
    customSpotifySearch ? [customSpotifySearch] : [],
    "spotify",
  );

  const soundcloudCustomResult = useSearchArtistLinksQuery(
    customSoundcloudSearch ? [customSoundcloudSearch] : [],
    "soundcloud",
  );

  const form = useForm<LinkStepData>({
    resolver: zodResolver(linkStepSchema),
    defaultValues: {
      spotifyUrl: artist.spotify_url ?? "",
      soundcloudUrl: artist.soundcloud_url ?? "",
    },
  });

  function getSpotifyResult() {
    return resolveProviderResult({
      provider: "spotify",
      providerLabel: "Spotify",
      artistName: artist.name,
      customSearch: customSpotifySearch,
      customResult: spotifyCustomResult,
      batchQueryResult,
    });
  }

  function getSoundcloudResult() {
    return resolveProviderResult({
      provider: "soundcloud",
      providerLabel: "SoundCloud",
      artistName: artist.name,
      customSearch: customSoundcloudSearch,
      customResult: soundcloudCustomResult,
      batchQueryResult,
    });
  }

  function handleCandidateSelect(candidate: Candidate, provider: Provider) {
    const update = mergeCandidateSelection(
      { artist, stagedUpdates },
      candidate,
      provider,
    );

    setStagedUpdates((prev) => ({ ...prev, ...update }));

    if (provider === "spotify" && update.spotify_url) {
      form.setValue("spotifyUrl", update.spotify_url);
    } else if (provider === "soundcloud" && update.soundcloud_url) {
      form.setValue("soundcloudUrl", update.soundcloud_url);
    }
  }

  function handleSearchAgain(provider: Provider, query: string) {
    if (provider === "spotify") {
      setCustomSpotifySearch(query);
    } else {
      setCustomSoundcloudSearch(query);
    }
  }

  function onSubmit(data: LinkStepData) {
    updateArtistMutation.mutate(
      {
        id: artist.id,
        updates: {
          ...(!artist.spotify_url && {
            spotify_url: data.spotifyUrl || null,
          }),
          ...(!artist.soundcloud_url && {
            soundcloud_url: data.soundcloudUrl || null,
          }),
          ...(stagedUpdates.image_url && {
            image_url: stagedUpdates.image_url,
          }),
          ...(stagedUpdates.description && {
            description: stagedUpdates.description,
          }),
        },
      },
      { onSuccess: onNext },
    );
  }

  const isLoadingSpotify =
    batchQueryResult.isLoading || spotifyCustomResult.isLoading;
  const isLoadingSoundcloud =
    batchQueryResult.isLoading || soundcloudCustomResult.isLoading;

  const spotifyResult = getSpotifyResult();
  const soundcloudResult = getSoundcloudResult();

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
              candidates={spotifyResult.candidates}
              searchError={spotifyResult.error}
              isLoadingCandidates={isLoadingSpotify}
              form={form}
              onSelectCandidate={(candidate) =>
                handleCandidateSelect(candidate, "spotify")
              }
              onSearchAgain={(query) => handleSearchAgain("spotify", query)}
            />
          )}

          {!artist.soundcloud_url && (
            <ProviderLinkField
              provider="soundcloud"
              fieldName="soundcloudUrl"
              label="SoundCloud URL"
              placeholder="https://soundcloud.com/..."
              candidates={soundcloudResult.candidates}
              searchError={soundcloudResult.error}
              isLoadingCandidates={isLoadingSoundcloud}
              form={form}
              onSelectCandidate={(candidate) =>
                handleCandidateSelect(candidate, "soundcloud")
              }
              onSearchAgain={(query) => handleSearchAgain("soundcloud", query)}
            />
          )}

          {(stagedUpdates.image_url || stagedUpdates.description) && (
            <div className="flex items-start gap-3 rounded-lg border p-3 text-sm">
              {stagedUpdates.image_url && (
                <img
                  src={stagedUpdates.image_url}
                  alt=""
                  className="h-12 w-12 rounded object-cover"
                />
              )}
              <div className="space-y-1">
                <p className="font-medium">Also staged from candidate</p>
                {stagedUpdates.image_url && (
                  <p className="text-muted-foreground">Image</p>
                )}
                {stagedUpdates.description && (
                  <p className="text-muted-foreground line-clamp-2">
                    {stagedUpdates.description}
                  </p>
                )}
              </div>
            </div>
          )}

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
}

interface ResolveProviderResultArgs {
  provider: Provider;
  providerLabel: string;
  artistName: string;
  customSearch: string;
  customResult: UseQueryResult<SearchResponse>;
  batchQueryResult: UseQueryResult<SearchResponse>;
}

function resolveProviderResult({
  provider,
  providerLabel,
  artistName,
  customSearch,
  customResult,
  batchQueryResult,
}: ResolveProviderResultArgs): {
  candidates: Candidate[];
  error?: string | undefined;
} {
  if (customSearch) {
    if (customResult.isError) {
      return {
        candidates: [],
        error: `${providerLabel} search failed. Please try again.`,
      };
    }
    const result = customResult.data?.results.find(
      (r) => r.provider === provider,
    );
    return { candidates: result?.candidates ?? [], error: result?.error };
  }

  if (batchQueryResult.isError) {
    return {
      candidates: [],
      error: `${providerLabel} search failed. Please try again.`,
    };
  }

  const result = batchQueryResult.data?.results.find(
    (r) => r.artistName === artistName && r.provider === provider,
  );
  return { candidates: result?.candidates ?? [], error: result?.error };
}
