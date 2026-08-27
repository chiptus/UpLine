import { Drama, Hammer, Music, Sparkles, type LucideIcon } from "lucide-react";
import { asSetType, type SetType } from "@/api/sets/types";

export interface SetTypeLabel {
  label: string;
  icon: LucideIcon;
  color: string;
  gradient: string;
  tint: string;
}

export const setTypeLabels: Record<SetType, SetTypeLabel> = {
  music: {
    label: "Music",
    icon: Music,
    color: "text-accent",
    gradient: "from-accent/30 to-accent/5",
    tint: "from-accent/15 to-accent/5",
  },
  workshop: {
    label: "Workshop",
    icon: Hammer,
    color: "text-notice",
    gradient: "from-notice/30 to-notice/5",
    tint: "from-notice/15 to-notice/5",
  },
  performance: {
    label: "Performance",
    icon: Drama,
    color: "text-live",
    gradient: "from-live/30 to-live/5",
    tint: "from-live/15 to-live/5",
  },
  other: {
    label: "Other",
    icon: Sparkles,
    color: "text-muted-foreground",
    gradient: "from-surface-active to-surface",
    tint: "from-foreground/10 to-foreground/5",
  },
};

export function getSetTypeLabel(setType: string | null): SetTypeLabel {
  return setTypeLabels[asSetType(setType) ?? "other"];
}
