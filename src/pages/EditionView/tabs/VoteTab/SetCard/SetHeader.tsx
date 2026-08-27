import { Badge } from "@/components/ui/badge";
import { CardTitle } from "@/components/ui/card";
import { Users } from "lucide-react";
import { getSetTypeLabel } from "@/lib/setTypeLabels";
import { isNonMusicSetType } from "@/api/sets/types";
import { SocialPlatformLinkList } from "./SocialPlatformLinkList";
import { useFestivalSet } from "../FestivalSetContext";

interface SetHeaderProps {
  size?: "sm" | "lg";
}

export function SetHeader({ size = "lg" }: SetHeaderProps) {
  const { set } = useFestivalSet();
  const isMultiArtist = set.artists.length > 1;
  const isNonMusicSet = isNonMusicSetType(set.set_type);
  const typeLabel = getSetTypeLabel(set.set_type);

  const titleClass =
    size === "sm"
      ? "text-foreground text-lg font-semibold truncate"
      : "text-foreground text-xl";

  return (
    <div className="flex items-center gap-2 mb-2">
      <CardTitle className={titleClass}>{set.name}</CardTitle>

      {isNonMusicSet && (
        <Badge variant="secondary" className="gap-1 shrink-0">
          <typeLabel.icon className="h-3 w-3" />
          {typeLabel.label}
        </Badge>
      )}

      {isMultiArtist && (
        <Badge
          variant="secondary"
          className="bg-accent-soft text-foreground text-xs"
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
