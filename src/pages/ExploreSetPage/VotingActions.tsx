import { Button } from "@/components/ui/button";
import { VOTE_CONFIG } from "@/lib/votes/config";
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
              ? `bg-gray-500 border-gray-500 text-white shadow-lg`
              : "border-gray-500 hover:bg-gray-500 hover:border-gray-500 text-gray-500 hover:text-white"
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
          className="text-white/60 hover:text-white"
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
          className="h-16 w-16 rounded-full border-orange-500 hover:bg-orange-500 hover:border-orange-500 text-orange-500 hover:text-white"
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
              ? `bg-blue-500 border-blue-500 text-white shadow-lg`
              : "border-blue-500 hover:bg-blue-500 hover:border-blue-500 text-blue-500 hover:text-white"
          }`}
          onClick={() => onVote(interestedConfig.value)}
        >
          <InterestedIcon className="h-6 w-6" />
        </Button>
      </motion.div>
    </div>
  );
}
