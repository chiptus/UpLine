import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Merge, X } from "lucide-react";
import type { Artist } from "@/api/artists/types";
import { useMergeArtistsMutation } from "@/api/artists/useMergeArtists";
import { useToast } from "@/components/ui/use-toast";
import { ArtistComparisonCard } from "./components/ArtistComparisonCard";
import { MergePreviewDialog } from "./components/MergePreviewDialog";
import { FieldSelector, GenreSelector } from "./components/FieldSelector";

interface ArtistComparisonModalProps {
  artists: Artist[];
  onClose: () => void;
}

type MergeChoices = {
  name: string;
  description: string | null;
  spotify_url: string | null;
  soundcloud_url: string | null;
  genres: string[];
};

export function ArtistComparisonModal({
  artists,
  onClose,
}: ArtistComparisonModalProps) {
  const [mergeChoices, setMergeChoices] = useState<MergeChoices>({
    name: artists[0]?.name || "",
    description: null,
    spotify_url: null,
    soundcloud_url: null,
    genres: [],
  });

  const [showMergePreview, setShowMergePreview] = useState(false);
  const mergeMutation = useMergeArtistsMutation();
  const { toast } = useToast();

  function handleFieldChange(field: keyof MergeChoices, value: unknown) {
    setMergeChoices((prev) => ({
      ...prev,
      [field]: value,
    }));
  }

  function getAllGenres() {
    const allGenres = new Set<string>();
    artists.forEach((artist) => {
      if (artist.artist_music_genres) {
        artist.artist_music_genres.forEach((genre) => {
          allGenres.add(genre.music_genre_id);
        });
      }
    });
    return Array.from(allGenres);
  }

  function handleGenreToggle(genreId: string) {
    setMergeChoices((prev) => ({
      ...prev,
      genres: prev.genres.includes(genreId)
        ? prev.genres.filter((g) => g !== genreId)
        : [...prev.genres, genreId],
    }));
  }

  function handleMergePreview() {
    const allGenres = getAllGenres();
    setMergeChoices((prev) => ({
      ...prev,
      genres: prev.genres.length === 0 ? allGenres : prev.genres,
    }));
    setShowMergePreview(true);
  }

  function handleConfirmMerge() {
    const primaryArtist = artists[0];
    const duplicateIds = artists.slice(1).map((artist) => artist.id);

    mergeMutation.mutate(
      {
        primaryArtistId: primaryArtist.id,
        duplicateArtistIds: duplicateIds,
        mergeData: {
          name: mergeChoices.name,
          description: mergeChoices.description,
          spotify_url: mergeChoices.spotify_url,
          soundcloud_url: mergeChoices.soundcloud_url,
          genreIds: mergeChoices.genres,
        },
      },
      {
        onSuccess: () => {
          toast({
            title: "Artists Merged Successfully",
            description: `Successfully merged ${duplicateIds.length} duplicate artist(s) into "${mergeChoices.name}".`,
          });
          onClose();
        },
        onError: (error) => {
          toast({
            title: "Merge Failed",
            description: `Failed to merge artists: ${error.message}`,
            variant: "destructive",
          });
        },
      },
    );
  }

  if (showMergePreview) {
    return (
      <MergePreviewDialog
        artists={artists}
        mergeChoices={mergeChoices}
        isLoading={mergeMutation.isPending}
        onBack={() => setShowMergePreview(false)}
        onConfirm={handleConfirmMerge}
      />
    );
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Merge className="h-5 w-5" />
            Compare & Merge: {artists[0]?.name}
          </DialogTitle>
          <DialogDescription>
            Choose which data to keep for each field. All votes and notes will
            be preserved.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {artists.map((artist, index) => (
              <ArtistComparisonCard
                key={artist.id}
                artist={artist}
                index={index}
              />
            ))}
          </div>

          <Separator />

          <div className="space-y-6">
            <h3 className="font-semibold">Choose Data to Keep</h3>

            <FieldSelector
              label="Description"
              fieldKey="description"
              artists={artists}
              selectedValue={mergeChoices.description}
              onValueChange={(value) => handleFieldChange("description", value)}
            />

            <FieldSelector
              label="Spotify URL"
              fieldKey="spotify_url"
              artists={artists}
              selectedValue={mergeChoices.spotify_url}
              onValueChange={(value) => handleFieldChange("spotify_url", value)}
            />

            <FieldSelector
              label="SoundCloud URL"
              fieldKey="soundcloud_url"
              artists={artists}
              selectedValue={mergeChoices.soundcloud_url}
              onValueChange={(value) =>
                handleFieldChange("soundcloud_url", value)
              }
            />

            <GenreSelector
              availableGenres={getAllGenres()}
              selectedGenres={mergeChoices.genres}
              onGenreToggle={handleGenreToggle}
            />
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-4">
          <Button variant="outline" onClick={onClose}>
            <X className="h-4 w-4 mr-1" />
            Cancel
          </Button>
          <Button onClick={handleMergePreview}>
            <Merge className="h-4 w-4 mr-1" />
            Preview Merge
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
