import { hasLinkOfType } from "@/api/custom-links/types";
import { TabEnablementContext } from "./types";

export function infoTabEnabled({
  festivalInfo,
  customLinks = [],
}: TabEnablementContext): boolean {
  return (
    !!festivalInfo?.info_text ||
    hasLinkOfType(customLinks, ["tickets", "website"])
  );
}
