import { queryOptions, useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Group } from "./types";
import { groupsKeys } from "./types";

interface UseGroupBySlugParams {
  slug?: string;
  userId?: string;
}

async function fetchGroupBySlug(slug: string, userId: string): Promise<Group> {
  // First, try to find the group where user is a member
  const { data: membership, error: membershipError } = await supabase
    .from("group_members")
    .select(
      `
      group_id,
      groups!inner (
        id,
        name,
        slug,
        description,
        created_by,
        archived,
        created_at,
        updated_at
      )
    `,
    )
    .eq("user_id", userId)
    .eq("groups.slug", slug)
    .eq("groups.archived", false)
    .single();

  if (!membershipError && membership) {
    return membership.groups as Group;
  }

  // If not found as a member, check if user is the creator
  const { data, error } = await supabase
    .from("groups")
    .select("*")
    .eq("slug", slug)
    .eq("created_by", userId)
    .eq("archived", false)
    .single();

  if (error) {
    throw new Error("Group not found or you don't have access");
  }

  return data;
}

export function groupBySlugQuery(slug: string, userId: string) {
  return queryOptions({
    queryKey: groupsKeys.bySlugDetail(slug, userId),
    queryFn: () => fetchGroupBySlug(slug, userId),
  });
}

export function useGroupBySlugQuery({ slug, userId }: UseGroupBySlugParams) {
  return useQuery({
    ...groupBySlugQuery(slug!, userId!),
    enabled: !!slug && !!userId,
  });
}
