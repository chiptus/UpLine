import type { Database } from "@/integrations/supabase/types";

export type GroupRow = Database["public"]["Tables"]["groups"]["Row"];
export type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];

export interface GroupAnalytics {
  id: string;
  name: string;
  member_count: number;
  created_at: string;
}

export interface UserAnalytics {
  id: string;
  username: string | null;
  email: string | null;
  vote_count: number;
  created_at: string;
}

export const analyticsQueries = {
  all: () => ["admin-analytics"] as const,
  groups: () => [...analyticsQueries.all(), "groups"] as const,
  users: () => [...analyticsQueries.all(), "users"] as const,
};
