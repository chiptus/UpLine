import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
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
import type { Provider, Candidate } from "@/api/artistSearch/types";
import { ProviderLinkField } from "./ProviderLinkField";

function requiredUrlSchema(isRequired: boolean) {
  return isRequired
    ? z.string().url("Enter a valid URL")
    : z.string().url().optional().or(z.literal(""));
}

function makeLinkStepSchema(artist: Artist) {
  return z.object({
    spotifyUrl: requiredUrlSchema(!artist.spotify_url),
    soundcloudUrl: requiredUrlSchema(!artist.soundcloud_url),
  });
}

type LinkStepData = z.infer<ReturnType<typeof makeLinkStepSchema>>;

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
    resolver: zodResolver(makeLinkStepSchema(artist)),
    defaultValues: {
      spotifyUrl: artist.spotify_url ?? "",
      soundcloudUrl: artist.soundcloud_url ?? "",
    },
  });

  function getProviderResult(provider: Provider): {
    candidates: Candidate[];
    error?: string | undefined;
  } {
    const customSearch =
      provider === "spotify" ? customSpotifySearch : customSoundcloudSearch;
    const customResult =
      provider === "spotify" ? spotifyCustomResult : soundcloudCustomResult;

    const providerLabel = provider === "spotify" ? "Spotify" : "SoundCloud";

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
      (r) => r.artistName === artist.name && r.provider === provider,
    );
    return { candidates: result?.candidates ?? [], error: result?.error };
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
        },
      },
      { onSuccess: onNext },
    );
  }

  const isLoadingSpotify =
    batchQueryResult.isLoading || spotifyCustomResult.isLoading;
  const isLoadingSoundcloud =
    batchQueryResult.isLoading || soundcloudCustomResult.isLoading;

  const spotifyResult = getProviderResult("spotify");
  const soundcloudResult = getProviderResult("soundcloud");

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
