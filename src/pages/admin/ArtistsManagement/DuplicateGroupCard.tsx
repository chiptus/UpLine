import { useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Eye, Merge, Trash2, Calendar, Link as LinkIcon } from "lucide-react";
import type { DuplicateGroup } from "@/api/artists/useDuplicateArtists";
import { ArtistComparisonModal } from "./ArtistComparisonModal";
import { GenreBadge } from "@/components/GenreBadge";
import { Artist } from "@/api/artists/types";

interface DuplicateGroupCardProps {
  group: DuplicateGroup;
  isSelected: boolean;
  onSelect: (isSelected: boolean) => void;
}

export function DuplicateGroupCard({
  group,
  isSelected,
  onSelect,
}: DuplicateGroupCardProps) {
  const [showComparison, setShowComparison] = useState(false);

  function formatDate(date: string) {
    return new Date(date).toLocaleDateString();
  }

  function getArtistLinks(artist: Artist) {
    const links = [];
    if (artist.spotify_url) links.push("Spotify");
    if (artist.soundcloud_url) links.push("SoundCloud");
    return links;
  }

  return (
    <>
      <Card
        className={`transition-all ${isSelected ? "ring-2 ring-purple-500" : ""}`}
      >
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Checkbox
                checked={isSelected}
                onCheckedChange={(checked) => onSelect(!!checked)}
              />
              <h3 className="font-semibold text-lg">{group.name}</h3>
              <Badge variant="destructive" className="text-xs">
                {group.count} duplicates
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowComparison(true)}
                className="flex items-center gap-1"
              >
                <Eye className="h-3 w-3" />
                Compare
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3">
            {group.artists.map((artist, index) => (
              <div key={artist.id} className="p-3 border rounded-lg bg-gray-50">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-medium text-muted-foreground">
                        #{index + 1}
                      </span>
                      <span className="text-sm font-medium">
                        ID: {artist.id.slice(-8)}
                      </span>
                    </div>
                    {artist.description && (
                      <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                        {artist.description}
                      </p>
                    )}
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {formatDate(artist.created_at)}
                      </div>
                      {getArtistLinks(artist).length > 0 && (
                        <div className="flex items-center gap-1">
                          <LinkIcon className="h-3 w-3" />
                          {getArtistLinks(artist).join(", ")}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {artist.artist_music_genres &&
                  artist.artist_music_genres.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {artist.artist_music_genres.map((genre) => (
                        <GenreBadge
                          key={genre.music_genre_id}
                          genreId={genre.music_genre_id}
                        />
                      ))}
                    </div>
                  )}
              </div>
            ))}
          </div>

          <div className="flex items-center gap-2 mt-4 pt-3 border-t">
            <Button
              variant="outline"
              size="sm"
              className="flex items-center gap-1 text-blue-600 hover:text-blue-700"
              onClick={() => setShowComparison(true)}
            >
              <Merge className="h-3 w-3" />
              Merge
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="flex items-center gap-1 text-destructive hover:text-destructive"
            >
              <Trash2 className="h-3 w-3" />
              Delete Duplicates
            </Button>
          </div>
        </CardContent>
      </Card>

      {showComparison && (
        <ArtistComparisonModal
          artists={group.artists}
          onClose={() => setShowComparison(false)}
        />
      )}
    </>
  );
}
