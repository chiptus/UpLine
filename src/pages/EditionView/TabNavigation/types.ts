import { FestivalInfo } from "@/hooks/queries/festival-info/useFestivalInfo";
import { LucideIcon } from "lucide-react";
import { ComponentType } from "react";

export type MainTab =
  | "sets"
  | "schedule"
  | "map"
  | "info"
  | "social"
  | "explore";

export type TabConfig = {
  key: MainTab;
  icon: LucideIcon;
  label: string;
  shortLabel: string;
  enabled: boolean | ((festivalInfo?: FestivalInfo) => boolean);
  Indicator?: ComponentType;
};

export interface TabButtonProps {
  config: TabConfig;
}
