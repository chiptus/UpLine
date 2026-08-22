import { Card, CardContent } from "@/components/ui/card";
import { ArtistImageLoader } from "@/components/ArtistImageLoader";

interface ArtistImageCardProps {
  imageUrl?: string | null;
  artistName: string;
}

export function ArtistImageCard({
  imageUrl,
  artistName,
}: ArtistImageCardProps) {
  return (
    <div className="lg:col-span-1">
      <Card className="bg-surface-raised backdrop-blur-md border">
        <CardContent className="p-6">
          <ArtistImageLoader
            src={imageUrl}
            alt={artistName}
            className="w-full aspect-square rounded-lg shadow-lg"
          />
        </CardContent>
      </Card>
    </div>
  );
}
