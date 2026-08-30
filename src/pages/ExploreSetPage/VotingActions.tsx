import { Button } from "@/components/ui/button";
import { VOTE_CONFIG } from "@/lib/voteConfig";
import { motion } from "framer-motion";
import { VoteButton } from "./VoteButton";

interface VotingActionsProps {
  onVote: (voteType: number) => void;
  onSkip: () => void;
  dragFeedback?: {
    direction: "left" | "right" | null;
    intensity: number;
  };
  currentVote?: number | undefined;
}

export function VotingActions({
  onVote,
  onSkip,
  dragFeedback,
  currentVote,
}: VotingActionsProps) {
  const wontGoConfig = VOTE_CONFIG.wontGo;
  const interestedConfig = VOTE_CONFIG.interested;
  const mustGoConfig = VOTE_CONFIG.mustGo;

  // Calculate highlight intensity based on drag feedback
  const isLeftDrag = dragFeedback?.direction === "left";
  const isRightDrag = dragFeedback?.direction === "right";
  const intensity = dragFeedback?.intensity || 0;

  return (
    <div className="flex items-center justify-center space-x-6 px-4">
      <VoteButton
        icon={wontGoConfig.icon}
        label={wontGoConfig.label}
        isSelected={isLeftDrag || currentVote === wontGoConfig.value}
        selectedClassName="bg-[hsl(var(--vote-skip)/0.28)] border-vote-skip text-vote-skip shadow-lg"
        unselectedClassName="border-vote-skip hover:bg-vote-skip-soft text-vote-skip"
        scale={isLeftDrag ? 1 + intensity * 0.3 : 1}
        opacity={isRightDrag ? 0.5 : 1}
        onClick={() => onVote(wontGoConfig.value)}
      />

      {/* Skip without voting */}
      <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
        <Button
          variant="ghost"
          className="text-foreground/60 hover:text-foreground"
          onClick={onSkip}
        >
          Skip
        </Button>
      </motion.div>

      <VoteButton
        icon={mustGoConfig.icon}
        label={mustGoConfig.label}
        isSelected={currentVote === mustGoConfig.value}
        selectedClassName="bg-[hsl(var(--vote-must)/0.28)] border-vote-must text-vote-must shadow-lg"
        unselectedClassName="border-vote-must hover:bg-vote-must-soft text-vote-must"
        scale={1}
        opacity={isLeftDrag || isRightDrag ? 0.5 : 1}
        onClick={() => onVote(mustGoConfig.value)}
      />

      <VoteButton
        icon={interestedConfig.icon}
        label={interestedConfig.label}
        isSelected={isRightDrag || currentVote === interestedConfig.value}
        selectedClassName="bg-[hsl(var(--vote-interested)/0.28)] border-vote-interested text-vote-interested shadow-lg"
        unselectedClassName="border-vote-interested hover:bg-vote-interested-soft text-vote-interested"
        scale={isRightDrag ? 1 + intensity * 0.3 : 1}
        opacity={isLeftDrag ? 0.5 : 1}
        onClick={() => onVote(interestedConfig.value)}
      />
    </div>
  );
}
