import type { Database } from "@/integrations/supabase/types";
import type { Artist } from "@/api/artists/types";

export const SET_TYPES = ["music", "workshop", "performance", "other"] as const;

export type SetType = (typeof SET_TYPES)[number];

export function asSetType(value: string | null): SetType | null {
  return SET_TYPES.includes(value as SetType) ? (value as SetType) : null;
}

export function isNonMusicSetType(
  setType: SetType | null,
): setType is Exclude<SetType, "music"> {
  return setType !== null && setType !== "music";
}

export type FestivalSet = Omit<
  Database["public"]["Tables"]["sets"]["Row"],
  "set_type"
> & {
  set_type: SetType | null;
  artists: Artist[];
  votes: { vote_type: number; user_id: string }[];
  stage_name?: string | null;
};

export type Stage = Database["public"]["Tables"]["stages"]["Row"];

export const setsKeys = {
  all: ["sets"] as const,
  lists: () => [...setsKeys.all, "list"] as const,
  list: (filters?: unknown) => [...setsKeys.lists(), filters] as const,
  details: () => [...setsKeys.all, "detail"] as const,
  detail: (id: string) => [...setsKeys.details(), id] as const,
  bySlug: (params: unknown) => [...setsKeys.details(), params] as const,
  byEdition: (editionId: string) =>
    [...setsKeys.all, "edition", editionId] as const,
};
