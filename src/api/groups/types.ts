import type { Database } from "@/integrations/supabase/types";

export type Group = Database["public"]["Tables"]["groups"]["Row"] & {
  member_count?: number;
  is_creator?: boolean;
  archived?: boolean;
  is_member?: boolean;
  created_at?: string;
};

export type GroupMember =
  Database["public"]["Tables"]["group_members"]["Row"] & {
    profiles?: {
      username?: string;
      email?: string;
    };
  };

export const groupsKeys = {
  all: ["groups"] as const,
  user: (userId: string, params?: unknown) =>
    [...groupsKeys.all, "user", userId, params] as const,
  details: () => [...groupsKeys.all, "detail"] as const,
  detail: (groupId: string) => [...groupsKeys.details(), groupId] as const,
  bySlug: () => [...groupsKeys.all, "by-slug"] as const,
  bySlugDetail: (slug: string, userId: string) =>
    [...groupsKeys.bySlug(), slug, userId] as const,
  members: (groupId: string) =>
    [...groupsKeys.all, "members", groupId] as const,
};
