import { Drama, Hammer, Music, Sparkles, type LucideIcon } from "lucide-react";
import { asSetType, type SetType } from "@/api/sets/types";

export interface SetTypeLabel {
  label: string;
  icon: LucideIcon;
  color: string;
}

export const setTypeLabels: Record<SetType, SetTypeLabel> = {
  music: { label: "Music", icon: Music, color: "text-accent" },
  workshop: { label: "Workshop", icon: Hammer, color: "text-amber-500" },
  performance: { label: "Performance", icon: Drama, color: "text-purple-500" },
  other: { label: "Other", icon: Sparkles, color: "text-muted-foreground" },
};

export function getSetTypeLabel(setType: string | null): SetTypeLabel {
  return setTypeLabels[asSetType(setType) ?? "other"];
}
