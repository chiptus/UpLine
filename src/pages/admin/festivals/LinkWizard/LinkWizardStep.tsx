import { useEffect } from "react";
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
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { Artist } from "@/api/artists/types";
import { useUpdateArtistMutation } from "@/api/artists/useUpdateArtist";

const linkStepSchema = z.object({
  spotifyUrl: z.string().url().optional().or(z.literal("")),
  soundcloudUrl: z.string().url().optional().or(z.literal("")),
});

type LinkStepData = z.infer<typeof linkStepSchema>;

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

  const form = useForm<LinkStepData>({
    resolver: zodResolver(linkStepSchema),
    defaultValues: {
      spotifyUrl: artist.spotify_url ?? "",
      soundcloudUrl: artist.soundcloud_url ?? "",
    },
  });

  useEffect(() => {
    form.reset({
      spotifyUrl: artist.spotify_url ?? "",
      soundcloudUrl: artist.soundcloud_url ?? "",
    });
  }, [artist, form]);

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
        },
      },
      { onSuccess: onNext },
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">{artist.name}</h3>
        <span className="text-sm text-muted-foreground">
          {position} of {total}
        </span>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          {!artist.spotify_url && (
            <FormField
              control={form.control}
              name="spotifyUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Spotify URL</FormLabel>
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
          )}

          {!artist.soundcloud_url && (
            <FormField
              control={form.control}
              name="soundcloudUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>SoundCloud URL</FormLabel>
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
          )}

          <div className="flex items-center justify-between gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={onPrev}
              disabled={position <= 1}
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Previous
            </Button>

            <div className="flex gap-2">
              <Button type="button" variant="ghost" onClick={onNext}>
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
