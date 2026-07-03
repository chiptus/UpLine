import type { Tables } from "@/integrations/supabase/types";

export type Profile = Tables<"profiles">;

export const profileKeys = {
  all: ["auth", "profile"] as const,
  detail: (userId?: string) => [...profileKeys.all, userId] as const,
};

export const userPermissionsKeys = {
  all: ["permissions"] as const,
  user: (userId: string | undefined, permission: string) =>
    [...userPermissionsKeys.all, { userId, permission }] as const,
};
