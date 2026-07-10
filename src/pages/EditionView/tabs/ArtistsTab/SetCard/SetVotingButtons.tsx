import { Button } from "@/components/ui/button";
import {
  VOTE_CONFIG,
  VOTES_TYPES,
  type VoteConfig,
  type VoteType,
} from "@/lib/voteConfig";
import { useFestivalSet } from "../FestivalSetContext";
import { useUserVotes } from "@/api/voting/useUserVotes";
import { useVote } from "@/api/voting/useVote";
import { useAuth } from "@/contexts/AuthContext";
import { useVoteCount } from "@/hooks/useVoteCount";

interface SetVotingButtonsProps {
  size?: "sm" | "default";
  layout?: "horizontal" | "vertical";
}

export function SetVotingButtons({
  size = "default",
  layout = "vertical",
}: SetVotingButtonsProps) {
  const { user, showAuthDialog } = useAuth();

  const { set, onLockSort } = useFestivalSet();
  const { getVoteCount } = useVoteCount(set);
  const userVotesQuery = useUserVotes(user?.id);
  const voteMutation = useVote();

  const userVoteForSet = userVotesQuery.data?.[set.id];

  const containerClass =
    layout === "horizontal" ? "flex items-center gap-2" : "space-y-3";

  return (
    <div className={containerClass}>
      {userVotesQuery.isLoading && (
        <div
          className={`h-4 w-4 animate-spin rounded-full border-2 border-t-transparent`}
        />
      )}
      {VOTES_TYPES.map((voteType) => {
        const config = VOTE_CONFIG[voteType];
        return (
          <VoteButton
            key={voteType}
            voteType={voteType}
            config={config}
            isSelected={userVoteForSet === config.value}
            onClick={() => handleVote(config.value)}
            voteCount={getVoteCount(config.value)}
            isVoting={voteMutation.isPending}
            size={size}
            layout={layout}
          />
        );
      })}
    </div>
  );

  function handleVote(voteType: number) {
    if (!user?.id) {
      showAuthDialog();

      return;
    }

    const setId = set.id;

    voteMutation.mutate(
      {
        setId,
        voteType,
        userId: user?.id,
        existingVote: userVoteForSet,
      },
      {
        onSuccess() {
          onLockSort();
        },
      },
    );
  }
}

function VoteButton({
  voteType,
  config,
  layout,
  isSelected,
  size,
  onClick,
  voteCount,
  isVoting,
}: {
  voteType: VoteType;
  isSelected: boolean;
  config: VoteConfig;
  size?: "sm" | "default";
  layout?: "horizontal" | "vertical";
  onClick(): void;
  voteCount: number;
  isVoting: boolean;
}) {
  const buttonClass = layout === "horizontal" ? "" : "flex-1";
  const IconComponent = config.icon;

  return (
    <div className="flex items-center gap-2">
      <Button
        variant={isSelected ? "default" : "outline"}
        size={size}
        onClick={() => onClick()}
        disabled={isVoting}
        aria-pressed={isSelected}
        data-testid={`vote-button-${voteType}`}
        className={`${buttonClass} ${
          isSelected ? config.buttonSelected : config.buttonUnselected
        }`}
        title={config.label}
      >
        <IconComponent className="h-4 w-4 mr-2" />
        <span data-testid={`vote-count-${voteType}`}>
          {layout === "horizontal"
            ? voteCount
            : `${config.label} (${voteCount})`}
        </span>
      </Button>
    </div>
  );
}
