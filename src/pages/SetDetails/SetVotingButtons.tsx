import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { FestivalSet } from "@/api/sets/types";
import { useUserVotes } from "@/api/voting/useUserVotes";
import { useVote } from "@/api/voting/useVote";
import { tallyVotes } from "@/lib/votes/score";
import { VOTE_CONFIG, getVoteConfig } from "@/lib/votes/config";

interface SetVotingButtonsProps {
  set: FestivalSet;
}

export function SetVotingButtons({ set }: SetVotingButtonsProps) {
  const { user, showAuthDialog } = useAuth();
  const { counts } = tallyVotes(set.votes);
  const userVotesQuery = useUserVotes(user?.id);
  const voteMutation = useVote();

  const setId = set.id;
  const userVoteForSet = userVotesQuery.data?.[setId];

  return (
    <div className="flex items-center gap-4 mb-6">
      <VoteButton
        voteType={2}
        isActive={userVoteForSet === 2}
        onClick={() => handleVote(2)}
        count={counts.mustGo}
      />
      <VoteButton
        voteType={1}
        isActive={userVoteForSet === 1}
        onClick={() => handleVote(1)}
        count={counts.interested}
      />
      <VoteButton
        voteType={-1}
        isActive={userVoteForSet === -1}
        onClick={() => handleVote(-1)}
        count={counts.wontGo}
      />
    </div>
  );

  function handleVote(voteType: number) {
    if (!user?.id) {
      showAuthDialog();

      return;
    }

    voteMutation.mutate({
      setId,
      voteType,
      userId: user?.id,
      existingVote: userVoteForSet,
    });
  }
}

interface VoteButtonProps {
  voteType: number;
  isActive: boolean;
  onClick: () => void;
  count: number;
}

function VoteButton({ voteType, isActive, onClick, count }: VoteButtonProps) {
  const configKey = getVoteConfig(voteType);
  if (!configKey) return null;

  const config = VOTE_CONFIG[configKey];
  const IconComponent = config.icon;

  return (
    <Button
      variant={isActive ? "default" : "outline"}
      onClick={onClick}
      className={isActive ? config.buttonSelected : config.buttonUnselected}
      title={config.label}
    >
      <IconComponent className="h-4 w-4 mr-1" />
      <span className="hidden sm:inline">
        {config.label} ({count})
      </span>
      <span className="sm:hidden">{count}</span>
    </Button>
  );
}
