import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { ChevronLeft, ChevronRight, RotateCcw } from "lucide-react";
import type { Artist } from "@/api/artists/types";
import { useUpdateArtistMutation } from "@/api/artists/useUpdateArtist";
import { useSearchArtistLinksQuery } from "@/api/artistSearch/useSearchArtistLinksQuery";
import {
  mergeCandidateSelection,
  type CandidateUpdate,
} from "@/api/artistSearch/mergeCandidateSelection";
import type { Provider, Candidate } from "@/api/artistSearch/types";
import { CandidateCards } from "./CandidateCards";

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
  onPrev: () => void;
  onNext: () => void;
}

export function LinkWizardStep({
  artist,
  position,
  total,
  onPrev,
  onNext,
}: LinkWizardStepProps) {
  const updateArtistMutation = useUpdateArtistMutation();
  const [stagedUpdates, setStagedUpdates] = useState<CandidateUpdate>({});
  const [customQuery, setCustomQuery] = useState<{
    provider: Provider;
    query: string;
  } | null>(null);

  const searchQuery = customQuery ? customQuery.query : artist.name;

  const searchQueryResult = useSearchArtistLinksQuery(
    searchQuery ? [searchQuery] : [],
    customQuery?.provider,
  );

  const form = useForm<LinkStepData>({
    resolver: zodResolver(makeLinkStepSchema(artist)),
    defaultValues: {
      spotifyUrl: artist.spotify_url ?? "",
      soundcloudUrl: artist.soundcloud_url ?? "",
    },
  });

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

  function handleSearchAgain(
    provider: Provider,
    currentUrl: string | undefined,
  ) {
    if (currentUrl) {
      setCustomQuery({ provider, query: currentUrl });
    }
  }

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
            <div className="space-y-3">
              <CandidateCards
                candidates={
                  searchQueryResult.data?.results.find(
                    (r) => r.provider === "spotify",
                  )?.candidates ?? []
                }
                provider="spotify"
                isLoading={searchQueryResult.isLoading}
                onSelectCandidate={(candidate) =>
                  handleCandidateSelect(candidate, "spotify")
                }
              />
              <FormField
                control={form.control}
                name="spotifyUrl"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex items-center justify-between">
                      <FormLabel>Spotify URL</FormLabel>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          handleSearchAgain("spotify", field.value)
                        }
                        disabled={searchQueryResult.isLoading}
                      >
                        <RotateCcw className="h-3 w-3 mr-1" />
                        Search Again
                      </Button>
                    </div>
                    <FormControl>
                      <Input
                        type="url"
                        placeholder="https://open.spotify.com/artist/..."
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          )}

          {!artist.soundcloud_url && (
            <div className="space-y-3">
              <CandidateCards
                candidates={
                  searchQueryResult.data?.results.find(
                    (r) => r.provider === "soundcloud",
                  )?.candidates ?? []
                }
                provider="soundcloud"
                isLoading={searchQueryResult.isLoading}
                onSelectCandidate={(candidate) =>
                  handleCandidateSelect(candidate, "soundcloud")
                }
              />
              <FormField
                control={form.control}
                name="soundcloudUrl"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex items-center justify-between">
                      <FormLabel>SoundCloud URL</FormLabel>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          handleSearchAgain("soundcloud", field.value)
                        }
                        disabled={searchQueryResult.isLoading}
                      >
                        <RotateCcw className="h-3 w-3 mr-1" />
                        Search Again
                      </Button>
                    </div>
                    <FormControl>
                      <Input
                        type="url"
                        placeholder="https://soundcloud.com/..."
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
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
