import type { Database } from "@/integrations/supabase/types";
import type { Artist } from "@/api/artists/types";
import { asEnumValue } from "@/lib/enum";
import {
  SET_TYPES,
  asSetType,
  type SetType,
} from "../../../supabase/functions/_shared/setTypes.ts";

export { SET_TYPES, asSetType };
export type { SetType };

export function isNonMusicSetType(
  setType: SetType | null,
): setType is Exclude<SetType, "music"> {
  return setType !== null && setType !== "music";
}

export const SET_STATUSES = ["confirmed", "tba"] as const;

export type SetStatus = (typeof SET_STATUSES)[number];

export function asSetStatus(value: string): SetStatus {
  return asEnumValue(SET_STATUSES, value) ?? "confirmed";
}

export type FestivalSet = Omit<
  Database["public"]["Tables"]["sets"]["Row"],
  "set_type" | "status"
> & {
  set_type: SetType | null;
  status: SetStatus;
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
