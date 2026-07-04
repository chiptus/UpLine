import { Badge } from "@/components/ui/badge";
import { Calendar, LinkIcon, Music, FileText } from "lucide-react";
import type { Artist } from "@/api/artists/types";
import { GenreBadge } from "@/components/GenreBadge";

interface ArtistComparisonCardProps {
  artist: Artist;
  index: number;
}

export function ArtistComparisonCard({
  artist,
  index,
}: ArtistComparisonCardProps) {
  function formatDate(date: string) {
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  }

  return (
    <div className="p-4 border rounded-lg">
      <div className="flex items-center gap-2 mb-3">
        <Badge variant={index === 0 ? "default" : "secondary"}>
          #{index + 1}
        </Badge>
        <span className="text-sm font-medium">ID: {artist.id.slice(-8)}</span>
      </div>

      <div className="space-y-3 text-sm">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Calendar className="h-3 w-3" />
          {formatDate(artist.created_at)}
        </div>

        {artist.description && (
          <div>
            <div className="flex items-center gap-1 mb-1">
              <FileText className="h-3 w-3" />
              <span className="text-xs font-medium">Description</span>
            </div>
            <p className="text-xs">{artist.description}</p>
          </div>
        )}

        <div className="space-y-1">
          {artist.spotify_url && (
            <div className="flex items-center gap-1 text-green-600">
              <LinkIcon className="h-3 w-3" />
              <span className="text-xs">Spotify</span>
            </div>
          )}
          {artist.soundcloud_url && (
            <div className="flex items-center gap-1 text-orange-600">
              <LinkIcon className="h-3 w-3" />
              <span className="text-xs">SoundCloud</span>
            </div>
          )}
        </div>

        {artist.artist_music_genres &&
          artist.artist_music_genres.length > 0 && (
            <div>
              <div className="flex items-center gap-1 mb-1">
                <Music className="h-3 w-3" />
                <span className="text-xs font-medium">Genres</span>
              </div>
              <div className="flex flex-wrap gap-1">
                {artist.artist_music_genres.map((genre) => (
                  <GenreBadge
                    key={genre.music_genre_id}
                    genreId={genre.music_genre_id}
                  />
                ))}
              </div>
            </div>
          )}
      </div>
    </div>
  );
}
