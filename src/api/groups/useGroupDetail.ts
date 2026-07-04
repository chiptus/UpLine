import { queryOptions, useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Group } from "./types";
import { groupsKeys } from "./types";

// Business logic function
async function fetchGroupById(groupId: string): Promise<Group | null> {
  const { data, error } = await supabase
    .from("groups")
    .select("*")
    .eq("id", groupId)
    .eq("archived", false)
    .single();

  if (error) {
    throw new Error("Failed to fetch group details");
  }

  return data;
}

export function groupDetailQuery(groupId: string) {
  return queryOptions({
    queryKey: groupsKeys.detail(groupId),
    queryFn: () => fetchGroupById(groupId),
  });
}

// Hook
export function useGroupDetailQuery(groupId: string) {
  return useQuery({
    ...groupDetailQuery(groupId),
    enabled: !!groupId,
  });
}
