import { Users } from "lucide-react";
import { SoundCloudBadge } from "./SoundCloudBadge";
import { Artist } from "@/api/artists/types";
import { MarkdownText } from "@/components/ui/markdown-text";

interface PrimaryArtistDisplayProps {
  artist: Artist;
  onSoundCloudClick?: (e: React.MouseEvent) => void;
}

export function PrimaryArtistDisplay({
  artist,
  onSoundCloudClick,
}: PrimaryArtistDisplayProps) {
  return (
    <div className="text-center space-y-2">
      <div className="w-20 h-20 mx-auto rounded-full overflow-hidden border-4 border-white/20">
        {artist.image_url ? (
          <img
            src={artist.image_url}
            alt={artist.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center">
            <Users className="h-8 w-8 text-white" />
          </div>
        )}
      </div>
      <h3 className="text-xl font-semibold">{artist.name}</h3>
      {artist.description && (
        <div className="text-sm text-gray-300 line-clamp-2">
          <MarkdownText
            content={artist.description}
            className="prose-sm prose-invert"
          />
        </div>
      )}

      <div className="flex justify-center mt-2">
        <SoundCloudBadge
          soundcloudUrl={artist.soundcloud_url}
          onClick={onSoundCloudClick}
        />
      </div>
    </div>
  );
}
