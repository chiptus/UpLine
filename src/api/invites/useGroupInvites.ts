import { queryOptions, useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { GroupInvite, inviteKeys } from "./types";

async function getGroupInvites(groupId: string): Promise<Array<GroupInvite>> {
  const { data, error } = await supabase
    .from("group_invites")
    .select("*")
    .eq("group_id", groupId)
    .eq("is_active", true)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error("Failed to fetch group invites");
  }

  return (
    data.map((i) => ({
      ...i,
      expires_at: i.expires_at || "",
      max_uses: i.max_uses || 0,
    })) || []
  );
}

export function groupInvitesQuery(groupId: string) {
  return queryOptions({
    queryKey: inviteKeys.group(groupId),
    queryFn: () => getGroupInvites(groupId),
    staleTime: 30 * 1000, // 30 seconds
    gcTime: 2 * 60 * 1000, // 2 minutes
  });
}

export function useGroupInvitesQuery(groupId: string) {
  return useQuery({
    ...groupInvitesQuery(groupId),
    enabled: !!groupId,
  });
}
