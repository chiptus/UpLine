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

  // Then fetch profile information for each member
  const membersWithProfiles = await Promise.all(
    members.map(async (member) => {
      const { data: profile } = await supabase
        .from("profiles")
        .select("username, email")
        .eq("id", member.user_id)
        .single();

      return {
        ...member,
        profiles: {
          username: profile?.username || undefined,
          email: profile?.email || undefined,
        },
      };
    }),
  );

  return membersWithProfiles;
}

export function groupMembersQuery(groupId: string) {
  return queryOptions({
    queryKey: groupsKeys.members(groupId),
    queryFn: () => fetchGroupMembers(groupId),
  });
}
