import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useActiveScope } from "@/contexts/ActiveScopeContext";
import { groupMembersQuery } from "@/api/groups/useGroupMembers";
import type { VoteScope } from "@/lib/voteScope";

/**
 * Resolves the Schedule tab's vote-chip scope from the global Active Scope
 * (the navbar switcher) — Everyone / Me / Active Group — plus the Active
 * Group's member ids for group-scope filtering, `undefined` while loading
 * (or when the scope isn't "group").
 */
export function useScheduleVoteScope() {
  const { current } = useActiveScope();
  const groupId = current.kind === "group" ? current.groupId : undefined;

  const { data: members } = useQuery({
    ...groupMembersQuery(groupId ?? ""),
    enabled: !!groupId,
  });

  const groupMemberIds = useMemo(
    () =>
      members ? new Set(members.map((member) => member.user_id)) : undefined,
    [members],
  );

  const voteScope: VoteScope = current.kind;

  return {
    voteScope,
    groupMemberIds: current.kind === "group" ? groupMemberIds : undefined,
  };
}
