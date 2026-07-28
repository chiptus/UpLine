import type { Enums, Tables } from "@/integrations/supabase/types";

export type CustomLink = Tables<"custom_links">;
export type LinkType = Enums<"link_type">;

export function hasLinkOfType(links: CustomLink[], types: LinkType[]): boolean {
  return links.some((link) => types.includes(link.link_type));
}

export const customLinksKeys = {
  all: ["customLinks"] as const,
  byFestival: (festivalId: string) =>
    [...customLinksKeys.all, festivalId] as const,
};
