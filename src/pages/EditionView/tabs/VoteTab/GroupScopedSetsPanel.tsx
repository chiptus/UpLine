import { useMemo } from "react";
import { useSuspenseQuery } from "@tanstack/react-query";
import { groupMembersQuery } from "@/api/groups/useGroupMembers";
import {
  SetsPanelContent,
  type SetsPanelInputs,
} from "@/pages/EditionView/tabs/VoteTab/SetsPanelContent";

export function GroupScopedSetsPanel({
  groupId,
  ...panelInputs
}: SetsPanelInputs & { groupId: string }) {
  const { data: members } = useSuspenseQuery(groupMembersQuery(groupId));
  const groupMemberIds = useMemo(
    () => new Set(members.map((member) => member.user_id)),
    [members],
  );

  return (
    <SetsPanelContent
      {...panelInputs}
      voteScope="group"
      groupMemberIds={groupMemberIds}
    />
  );
}
