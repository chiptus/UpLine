import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FestivalSet } from "@/api/sets/types";
import { SetVotingButtons } from "@/pages/SetDetails/SetVotingButtons";
import { SetTypePlaceholder } from "@/components/SetTypePlaceholder";
import { NonMusicSetBanner } from "./NonMusicSetBanner";
import { NonMusicSetAboutCard } from "./NonMusicSetAboutCard";

interface NonMusicSetDetailProps {
  set: FestivalSet;
  netVoteScore: number;
  use24Hour: boolean;
}

export function NonMusicSetDetail({
  set,
  netVoteScore,
  use24Hour,
}: NonMusicSetDetailProps) {
  const artistWithImage = set.artists.find((artist) => artist.image_url);

  return (
    <div className="mb-8 space-y-6">
      <NonMusicSetBanner
        set={set}
        netVoteScore={netVoteScore}
        use24Hour={use24Hour}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {artistWithImage?.image_url ? (
          <img
            src={artistWithImage.image_url}
            alt={artistWithImage.name}
            className="aspect-square w-full rounded-lg object-cover"
          />
        ) : (
          <SetTypePlaceholder
            setType={set.set_type}
            className="aspect-square"
          />
        )}

        <div className="lg:col-span-2 space-y-6">
          <NonMusicSetAboutCard set={set} />

          <Card className="bg-surface-raised backdrop-blur-md border">
            <CardHeader>
              <CardTitle className="text-lg">Your vote</CardTitle>
            </CardHeader>
            <CardContent>
              <SetVotingButtons set={set} />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
