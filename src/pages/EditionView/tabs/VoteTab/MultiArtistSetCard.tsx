import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { SetHeader } from "./SetCard/SetHeader";
import { SetImage } from "./SetCard/SetImage";
import { SetMetadata } from "./SetCard/SetMetadata";
import { SetDescription } from "./SetCard/SetDescription";
import { SetVotingButtons } from "./SetCard/SetVotingButtons";

export function MultiArtistSetCard() {
  return (
    <Card className="bg-surface-raised backdrop-blur-md border hover:bg-surface-active transition-all duration-300 overflow-hidden">
      <CardHeader className="pb-4">
        {/* Set Image with Mixed Artists */}
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
