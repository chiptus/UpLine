import { useAuth } from "@/contexts/AuthContext";
import { useScheduleVoteScope } from "@/hooks/useScheduleVoteScope";
import { VoteScopeToggle } from "@/pages/EditionView/tabs/ScheduleTab/VoteScopeToggle";

interface ScheduleVoteScopeToggleProps {
  tab: "timeline" | "list";
}

/**
 * Me / Active Group toggle for the Schedule tab's vote-type filter chips.
 * Hidden when logged out or when the user has no Active Group to filter by.
 */
export function ScheduleVoteScopeToggle({ tab }: ScheduleVoteScopeToggleProps) {
  const { user } = useAuth();
  const { voteScope, groupName, updateVoteScope } = useScheduleVoteScope(tab);

  if (!user || !groupName) {
    return null;
  }

  return (
    <VoteScopeToggle
      scope={voteScope}
      onScopeChange={updateVoteScope}
      groupName={groupName}
    />
  );
}
