import type { Tables } from "@/integrations/supabase/types";

export type Vote = Tables<"votes">;

export const groupVotesKeys = {
  all: ["groups"] as const,
  votes: (setId: string, groupId: string) =>
    [...groupVotesKeys.all, "votes", setId, groupId] as const,
};

export const userVotesKeys = {
  all: ["votes"] as const,
  user: (userId: string) => [...userVotesKeys.all, "user", userId] as const,
};
