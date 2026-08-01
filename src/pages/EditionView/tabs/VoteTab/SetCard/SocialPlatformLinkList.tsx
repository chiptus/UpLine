import { SocialPlatformLink } from "./SocialPlatformLink";

interface Artist {
  id: string;
  name: string;
  spotify_url?: string | null;
  soundcloud_url?: string | null;
}

interface SocialPlatformLinkListProps {
  artist: Artist;
  size?: "sm" | "md";
}

export function SocialPlatformLinkList({
  artist,
  size = "md",
}: SocialPlatformLinkListProps) {
  return (
    <div className="flex items-center gap-1">
      {artist.spotify_url && (
        <SocialPlatformLink
          url={artist.spotify_url}
          artistName={artist.name}
          size={size}
        />
      )}
      {artist.soundcloud_url && (
        <SocialPlatformLink
          url={artist.soundcloud_url}
          artistName={artist.name}
          size={size}
        />
      )}
    </div>
  );
}
