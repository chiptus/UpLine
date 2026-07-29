import { FestivalInfo } from "@/api/festival-info/types";
import { CustomLink } from "@/api/custom-links/types";
import { LucideIcon } from "lucide-react";
import { ComponentType } from "react";

export type MainTab =
  | "sets"
  | "schedule"
  | "map"
  | "info"
  | "social"
  | "explore";

export interface TabEnablementContext {
  festivalInfo?: FestivalInfo | null;
  customLinks?: CustomLink[];
}

export type TabConfig = {
  key: MainTab;
  icon: LucideIcon;
  label: string;
  shortLabel: string;
  enabled: boolean | ((context: TabEnablementContext) => boolean);
  Indicator?: ComponentType;
};

export interface TabButtonProps {
  config: TabConfig;
}
