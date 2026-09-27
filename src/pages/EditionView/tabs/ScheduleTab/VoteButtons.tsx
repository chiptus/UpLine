import {
  VOTES_TYPES,
  VOTE_CONFIG,
  VoteType,
  getVoteConfig,
  getVoteValue,
} from "@/lib/votes/config";
import { tallyVotes } from "@/lib/votes/score";
import { cn } from "@/lib/utils";
import type { ScheduleSet } from "@/hooks/useScheduleData";
import { useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useUserVotesQuery } from "@/api/voting/useUserVotesQuery";
import { useVoteMutation } from "@/api/voting/useVoteMutation";

interface VoteButtonsProps {
  set: ScheduleSet;
}

export function VoteButtons({ set }: VoteButtonsProps) {
  const { user, showAuthDialog } = useAuth();
  const userVotesQuery = useUserVotesQuery(user?.id);
  const voteMutation = useVoteMutation();

  const userVote = userVotesQuery.data?.[set.id];
  const userVoteType = useMemo(() => {
    return userVote ? getVoteConfig(userVote) : undefined;
  }, [userVote]);

  const { counts } = tallyVotes(set.votes);

  return (
    <div
      role="group"
      aria-label={`Vote for ${set.name}`}
      className="flex gap-3 mt-2"
    >
      {VOTES_TYPES.map((voteType) => {
        return (
          <VoteButton
            voteType={voteType}
            key={voteType}
            onVote={() => handleVote(getVoteValue(voteType))}
            count={counts[voteType]}
            value={userVoteType}
          />
        );
      })}
    </div>
  );

  async function handleVote(voteType: number) {
    if (!user) {
      showAuthDialog();
      return;
    }

    voteMutation.mutate({
      setId: set.id,
      voteType,
      userId: user.id,
      existingVote: userVote,
    });
  }
}

function VoteButton({
  value,
  voteType,
  count,
  onVote,
}: {
  voteType: VoteType;
  value: VoteType | undefined;
  count: number;
  onVote(): void;
}) {
  const config = VOTE_CONFIG[voteType];
  const IconComponent = config.icon;
  const isSelected = value === voteType;

  return (
    <button
      className={cn(
        `flex items-center gap-1 cursor-pointer hover:text-subtle-foreground`,
        isSelected
          ? `${config.iconColor} hover:text-subtle-foreground`
          : `${config.descColor} `,
      )}
      type="button"
      aria-pressed={isSelected}
      aria-label={config.label}
      onClick={() => onVote()}
    >
      <IconComponent className="h-3 w-3" />
      <span className="text-xs">{count}</span>
    </button>
  );
}
