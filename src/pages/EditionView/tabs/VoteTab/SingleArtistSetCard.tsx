import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { SetHeader } from "./SetCard/SetHeader";
import { SetImage } from "./SetCard/SetImage";
import { SetMetadata } from "./SetCard/SetMetadata";
import { SetDescription } from "./SetCard/SetDescription";
import { SetVotingButtons } from "./SetCard/SetVotingButtons";

export function SingleArtistSetCard() {
  return (
    <Card className="bg-white/10 backdrop-blur-md border-purple-400/30 hover:bg-white/15 transition-all duration-300 overflow-hidden">
      <CardHeader className="pb-4">
        <SetImage />

        <div className="flex items-start justify-between">
          <div className="flex-1">
            <SetHeader />
            <SetMetadata />
          </div>
        </div>

        <SetDescription />
      </CardHeader>

      <CardContent>
        <SetVotingButtons />
      </CardContent>
    </Card>
  );
}
