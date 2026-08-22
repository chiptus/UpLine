import { ArtistImageLoader } from "@/components/ArtistImageLoader";
import { Artist } from "@/api/artists/types";

interface MixedArtistImageProps {
  artists: Artist[];
  setName: string;
  className?: string;
}

export function MixedArtistImage({
  artists,
  setName,
  className = "",
}: MixedArtistImageProps) {
  const artistsWithImages = artists.filter((artist) => artist.image_url);

  // If no images available, show placeholder
  if (artistsWithImages.length === 0) {
    return (
      <div
        className={`bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center ${className}`}
      >
        <div className="text-foreground text-center p-4">
          <div className="text-2xl font-bold mb-2">🎵</div>
          {/* <div className="text-sm font-medium">{setName}</div> */}
        </div>
      </div>
    );
  }

  // Single image - just show it
  if (artistsWithImages.length === 1) {
    return (
      <ArtistImageLoader
        src={artistsWithImages[0].image_url}
        alt={setName}
        className={className}
      />
    );
  }

  // Two images - split vertically
  if (artistsWithImages.length === 2) {
    return (
      <div className={`relative overflow-hidden ${className}`}>
        <div className="absolute inset-0 flex">
          <div className="w-1/2">
            <ArtistImageLoader
              src={artistsWithImages[0].image_url}
              alt={artistsWithImages[0].name}
              className="w-full h-full object-cover"
            />
          </div>
          <div className="w-1/2">
            <ArtistImageLoader
              src={artistsWithImages[1].image_url}
              alt={artistsWithImages[1].name}
              className="w-full h-full object-cover"
            />
          </div>
        </div>
        {/* Overlay with set name */}
        {/* <div className="absolute inset-0 bg-black/20 flex items-end">
          <div className="w-full bg-gradient-to-t from-black/60 to-transparent p-3">
            <div className="text-white text-sm font-medium text-center">
              {setName}
            </div>
          </div>
        </div> */}
      </div>
    );
  }

  // Three images - one large, two small
  if (artistsWithImages.length === 3) {
    return (
      <div className={`relative overflow-hidden ${className}`}>
        <div className="absolute inset-0 flex">
          {/* Main image takes left 2/3 */}
          <div className="w-2/3">
            <ArtistImageLoader
              src={artistsWithImages[0].image_url}
              alt={artistsWithImages[0].name}
              className="w-full h-full object-cover"
            />
          </div>
          {/* Two smaller images stack on right 1/3 */}
          <div className="w-1/3 flex flex-col">
            <div className="h-1/2">
              <ArtistImageLoader
                src={artistsWithImages[1].image_url}
                alt={artistsWithImages[1].name}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="h-1/2">
              <ArtistImageLoader
                src={artistsWithImages[2].image_url}
                alt={artistsWithImages[2].name}
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </div>
        {/* Overlay with set name */}
        {/* <div className="absolute inset-0 bg-black/20 flex items-end">
          <div className="w-full bg-gradient-to-t from-black/60 to-transparent p-3">
            <div className="text-white text-sm font-medium text-center">
              {setName}
            </div>
          </div>
        </div> */}
      </div>
    );
  }

  // Four or more images - 2x2 grid with overflow indicator
  return (
    <div className={`relative overflow-hidden ${className}`}>
      <div className="absolute inset-0 grid grid-cols-2 grid-rows-2">
        {artistsWithImages.slice(0, 4).map((artist, index) => (
          <div key={artist.id} className="relative">
            <ArtistImageLoader
              src={artist.image_url}
              alt={artist.name}
              className="w-full h-full object-cover"
            />
            {/* Show count overlay on last image if more than 4 */}
            {index === 3 && artistsWithImages.length > 4 && (
              <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                <div className="text-foreground text-lg font-bold">
                  +{artistsWithImages.length - 4}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
      {/* Overlay with set name */}
      {/* <div className="absolute inset-0 bg-black/20 flex items-end">
        <div className="w-full bg-gradient-to-t from-black/60 to-transparent p-3">
          <div className="text-white text-sm font-medium text-center">
            {setName}
          </div>
        </div>
      </div> */}
    </div>
  );
}
