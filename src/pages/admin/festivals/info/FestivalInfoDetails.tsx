import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2, Edit, AlertTriangle } from "lucide-react";
import { useFestivalInfoQuery } from "@/api/festival-info/useFestivalInfo";
import { useCustomLinksQuery } from "@/api/custom-links/useCustomLinks";
import { FestivalMapField } from "./FestivalFields/FestivalMapField";
import { FestivalInfoField } from "./FestivalFields/FestivalInfoField";
import { FestivalSocialField } from "./FestivalFields/FestivalSocialField";
import { FestivalLinksField } from "./FestivalFields/FestivalLinksField";

interface FestivalInfoDetailsProps {
  festivalId: string;
}

export function FestivalInfoDetails({ festivalId }: FestivalInfoDetailsProps) {
  const festivalInfoQuery = useFestivalInfoQuery(festivalId);
  const customLinksQuery = useCustomLinksQuery(festivalId);

  if (festivalInfoQuery.isLoading || customLinksQuery.isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-6 w-6 animate-spin mr-2" />
        <span>Loading festival info...</span>
      </div>
    );
  }

  const festivalInfo = festivalInfoQuery.data;
  const customLinks = customLinksQuery.data || [];

  if (!festivalInfo) {
    return (
      <div className="space-y-4">
        <MissingInfoTextWarning />
        <p className="text-muted-foreground">
          No festival information has been added yet.
        </p>
        <div className="flex gap-2">
          <Button size="sm" disabled>
            <Edit className="h-4 w-4 mr-2" />
            Add Map
          </Button>
          <Button size="sm" disabled>
            <Edit className="h-4 w-4 mr-2" />
            Add Info
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          Click the sections above to add festival information.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {!festivalInfo.info_text && <MissingInfoTextWarning />}

      <FestivalMapField
        festivalId={festivalId}
        mapImageUrl={festivalInfo.map_image_url}
      />

      <FestivalInfoField
        festivalId={festivalId}
        infoText={festivalInfo.info_text}
      />

      <FestivalSocialField
        festivalId={festivalId}
        facebookUrl={festivalInfo.facebook_url}
        instagramUrl={festivalInfo.instagram_url}
      />

      <FestivalLinksField festivalId={festivalId} customLinks={customLinks} />
    </div>
  );
}

function MissingInfoTextWarning() {
  return (
    <Alert>
      <AlertTriangle className="h-4 w-4" />
      <AlertTitle>Info tab hidden from visitors</AlertTitle>
      <AlertDescription>
        This festival doesn't have info text, so the Info tab won't be shown
        to visitors. Add information below to make it visible.
      </AlertDescription>
    </Alert>
  );
}
