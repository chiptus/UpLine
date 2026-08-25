import { Button } from "@/components/ui/button";
import { VOTE_CONFIG } from "@/lib/voteConfig";
import { motion } from "framer-motion";

interface VotingActionsProps {
  onVote: (voteType: number) => void;
  onSkip: () => void;
  dragFeedback?: {
    direction: "left" | "right" | null;
    intensity: number;
  };
}

export function VotingActions({
  onVote,
  onSkip,
  dragFeedback,
}: VotingActionsProps) {
  const wontGoConfig = VOTE_CONFIG.wontGo;
  const interestedConfig = VOTE_CONFIG.interested;
  const mustGoConfig = VOTE_CONFIG.mustGo;

  const WontGoIcon = wontGoConfig.icon;
  const InterestedIcon = interestedConfig.icon;
  const MustGoIcon = mustGoConfig.icon;

  // Calculate highlight intensity based on drag feedback
  const isLeftDrag = dragFeedback?.direction === "left";
  const isRightDrag = dragFeedback?.direction === "right";
  const intensity = dragFeedback?.intensity || 0;

  return (
    <div className="flex items-center justify-center space-x-6 px-4">
      {/* Won't Go */}
      <motion.div
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        animate={{
          scale: isLeftDrag ? 1 + intensity * 0.3 : 1,
          opacity: isRightDrag ? 0.5 : 1,
        }}
        transition={{ duration: 0.1 }}
      >
        <Button
          size="lg"
          variant="outline"
          className={`h-16 w-16 rounded-full transition-all duration-100 ${
            isLeftDrag
              ? `bg-[hsl(var(--vote-skip)/0.28)] border-vote-skip text-vote-skip shadow-lg`
              : "border-vote-skip hover:bg-vote-skip-soft text-vote-skip"
          }`}
          onClick={() => onVote(wontGoConfig.value)}
        >
          <WontGoIcon className="h-6 w-6" />
        </Button>
      </motion.div>

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

      {/* Must Go */}
      <motion.div
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        animate={{
          opacity: isLeftDrag || isRightDrag ? 0.5 : 1,
        }}
        transition={{ duration: 0.1 }}
      >
        <Button
          size="lg"
          variant="outline"
          className="h-16 w-16 rounded-full border-vote-must hover:bg-vote-must-soft text-vote-must"
          onClick={() => onVote(mustGoConfig.value)}
        >
          <MustGoIcon className="h-6 w-6" />
        </Button>
      </motion.div>

      {/* Interested */}
      <motion.div
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        animate={{
          scale: isRightDrag ? 1 + intensity * 0.3 : 1,
          opacity: isLeftDrag ? 0.5 : 1,
        }}
        transition={{ duration: 0.1 }}
      >
        <Button
          size="lg"
          variant="outline"
          className={`h-16 w-16 rounded-full transition-all duration-100 ${
            isRightDrag
              ? `bg-[hsl(var(--vote-interested)/0.28)] border-vote-interested text-vote-interested shadow-lg`
              : "border-vote-interested hover:bg-vote-interested-soft text-vote-interested"
          }`}
          onClick={() => onVote(interestedConfig.value)}
        >
          <InterestedIcon className="h-6 w-6" />
        </Button>
      </motion.div>
    </div>
  );
}
