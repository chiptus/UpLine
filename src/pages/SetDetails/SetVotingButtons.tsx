import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { FestivalSet } from "@/api/sets/types";
import { useUserVotesQuery } from "@/api/voting/useUserVotesQuery";
import { useVoteMutation } from "@/api/voting/useVoteMutation";
import { useVoteCount } from "@/hooks/useVoteCount";
import { VOTE_CONFIG, getVoteConfig } from "@/lib/voteConfig";

interface SetVotingButtonsProps {
  set: FestivalSet;
}

export function SetVotingButtons({ set }: SetVotingButtonsProps) {
  const { user, showAuthDialog } = useAuth();
  const { getVoteCount } = useVoteCount(set);
  const userVotesQuery = useUserVotesQuery(user?.id);
  const voteMutation = useVoteMutation();

  const setId = set.id;
  const userVoteForSet = userVotesQuery.data?.[setId];

  return (
    <div className="flex items-center gap-4 mb-6">
      <VoteButton
        voteType={2}
        isActive={userVoteForSet === 2}
        onClick={() => handleVote(2)}
        count={getVoteCount(2)}
      />
      <VoteButton
        voteType={1}
        isActive={userVoteForSet === 1}
        onClick={() => handleVote(1)}
        count={getVoteCount(1)}
      />
      <VoteButton
        voteType={-1}
        isActive={userVoteForSet === -1}
        onClick={() => handleVote(-1)}
        count={getVoteCount(-1)}
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
