import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";

interface VoteButtonProps {
  icon: LucideIcon;
  label: string;
  isSelected: boolean;
  selectedClassName: string;
  unselectedClassName: string;
  scale: number;
  opacity: number;
  onClick: () => void;
}

export function VoteButton({
  icon: Icon,
  label,
  isSelected,
  selectedClassName,
  unselectedClassName,
  scale,
  opacity,
  onClick,
}: VoteButtonProps) {
  return (
    <motion.div
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
      animate={{ scale, opacity }}
      transition={{ duration: 0.1 }}
    >
      <Button
        size="lg"
        variant="outline"
        aria-pressed={isSelected}
        aria-label={label}
        className={cn(
          "h-16 w-16 rounded-full transition-all duration-100",
          isSelected ? selectedClassName : unselectedClassName,
        )}
        onClick={onClick}
      >
        <Icon className="h-6 w-6" />
      </Button>
    </motion.div>
  );
}
