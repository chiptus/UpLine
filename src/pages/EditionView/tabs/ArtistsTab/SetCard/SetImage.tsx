import { Link } from "@tanstack/react-router";
import { ArtistImageLoader } from "@/components/ArtistImageLoader";
import { useFestivalSet } from "../FestivalSetContext";
import { MixedArtistImage } from "@/pages/SetDetails/MixedArtistImage";

interface SetImageProps {
  className?: string;
  size?: "sm" | "md" | "lg";
}

export function SetImage({ className = "", size = "lg" }: SetImageProps) {
  const { set } = useFestivalSet();
  const isMultiArtist = set.artists.length > 1;

  const sizeClasses = {
    sm: "w-12 h-12",
    md: "w-16 h-16",
    lg: "aspect-square w-full mb-4",
  };

  const containerClass = `${sizeClasses[size]} ${className} overflow-hidden rounded-lg hover:opacity-90 transition-opacity cursor-pointer`;

  return (
    <Link to={`./${set.slug}` as any} className="block flex-shrink-0">
      {isMultiArtist ? (
        <MixedArtistImage
          artists={set.artists}
          setName={set.name}
          className={containerClass}
        />
      ) : (
        <ArtistImageLoader
          src={set.artists[0]?.image_url}
          alt={set.name}
          className={containerClass}
        />
      )}
    </Link>
  );
}
