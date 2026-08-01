import { SocialPlatformLinkList } from "./SocialPlatformLinkList";

interface Artist {
  id: string;
  name: string;
  spotify_url?: string | null;
  soundcloud_url?: string | null;
}

interface MultiArtistInfoProps {
  artists: Artist[];
  size?: "sm" | "md";
}

export function MultiArtistInfo({
  artists,
  size = "md",
}: MultiArtistInfoProps) {
  return (
    <div className="flex gap-4">
      {artists.map((artist) => (
        <div key={artist.id} className="flex items-center gap-2">
          <span className="text-xs text-purple-200 mr-1">{artist.name}</span>
          <SocialPlatformLinkList artist={artist} size={size} />
        </div>
      ))}
    </div>
  );
}
