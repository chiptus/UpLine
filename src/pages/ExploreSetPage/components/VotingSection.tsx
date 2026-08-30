import { VotingActions } from "../VotingActions";
import { FestivalSet } from "@/api/sets/types";

interface VotingSectionProps {
  currentSet: FestivalSet | undefined;
  onVote: (voteType: number) => void;
  onSkip: () => void;
  dragFeedback: {
    direction: "left" | "right" | null;
    intensity: number;
  };
  currentVote: number | undefined;
}

export function VotingSection({
  currentSet,
  onVote,
  onSkip,
  dragFeedback,
  currentVote,
}: VotingSectionProps) {
  if (!currentSet) {
    return null;
  }

  return (
    <div className="absolute bottom-8 left-0 right-0 z-20">
      <VotingActions
        onVote={onVote}
        onSkip={onSkip}
        dragFeedback={dragFeedback}
        currentVote={currentVote}
      />
    </div>
  );
}
