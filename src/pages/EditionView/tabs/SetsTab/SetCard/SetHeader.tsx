import { Badge } from "@/components/ui/badge";
import { CardTitle } from "@/components/ui/card";
import { Users } from "lucide-react";
import { SocialPlatformLinkList } from "./SocialPlatformLinkList";
import { useFestivalSet } from "../FestivalSetContext";

interface SetHeaderProps {
  size?: "sm" | "lg";
}

export function SetHeader({ size = "lg" }: SetHeaderProps) {
  const { set } = useFestivalSet();
  const isMultiArtist = set.artists.length > 1;

  const titleClass =
    size === "sm"
      ? "text-white text-lg font-semibold truncate"
      : "text-white text-xl";

  return (
    <div className="flex items-center gap-2 mb-2">
      <CardTitle className={titleClass}>{set.name}</CardTitle>

      {isMultiArtist && (
        <Badge
          variant="secondary"
          className="bg-purple-600/50 text-purple-100 text-xs"
        >
          <Users className="h-3 w-3 mr-1" />
          {set.artists.length}
        </Badge>
      )}

      {set.artists.length === 1 && (
        <SocialPlatformLinkList
          artist={set.artists[0]}
          size={size === "sm" ? "sm" : "md"}
        />
      )}
    </div>
  );
}
