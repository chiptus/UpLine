import { Drama, Hammer, Music, Sparkles, type LucideIcon } from "lucide-react";
import { asSetType, type SetType } from "@/api/sets/types";

export interface SetTypeLabel {
  label: string;
  icon: LucideIcon;
  color: string;
  gradient: string;
}

export const setTypeLabels: Record<SetType, SetTypeLabel> = {
  music: {
    label: "Music",
    icon: Music,
    color: "text-accent",
    gradient: "from-indigo-500/40 to-purple-500/20",
  },
  workshop: {
    label: "Workshop",
    icon: Hammer,
    color: "text-amber-500",
    gradient: "from-amber-500/40 to-orange-500/20",
  },
  performance: {
    label: "Performance",
    icon: Drama,
    color: "text-purple-500",
    gradient: "from-rose-500/40 to-pink-500/20",
  },
  other: {
    label: "Other",
    icon: Sparkles,
    color: "text-muted-foreground",
    gradient: "from-slate-500/40 to-slate-400/20",
  },
};

export function getSetTypeLabel(setType: string | null): SetTypeLabel {
  return setTypeLabels[asSetType(setType) ?? "other"];
}
