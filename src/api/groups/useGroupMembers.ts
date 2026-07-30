import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { GroupMember } from "./types";
import { groupsKeys } from "./types";

// Business logic function
async function fetchGroupMembers(groupId: string): Promise<GroupMember[]> {
  // First get the group members
  const { data: members, error } = await supabase
    .from("group_members")
    .select("*")
    .eq("group_id", groupId)
    .order("joined_at", { ascending: true });

  if (error) {
    console.error("Error fetching group members:", error);
    return [];
  }

  if (!members || members.length === 0) {
    return [];
  }

  const userIds = members.map((member) => member.user_id);
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, username, email")
    .in("id", userIds);

  const profilesByUserId = new Map(
    (profiles || []).map((profile) => [profile.id, profile]),
  );

  return members.map((member) => {
    const profile = profilesByUserId.get(member.user_id);

    return {
      ...member,
      profiles: {
        username: profile?.username || undefined,
        email: profile?.email || undefined,
      },
    };
  });
}

export function groupMembersQuery(groupId: string) {
  return queryOptions({
    queryKey: groupsKeys.members(groupId),
    queryFn: () => fetchGroupMembers(groupId),
  });
}
