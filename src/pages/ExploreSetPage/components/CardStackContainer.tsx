import { motion, AnimatePresence } from "framer-motion";
import { SetExploreCard } from "../SetExploreCard";
import { FestivalSet } from "@/api/sets/types";

interface CardStackContainerProps {
  currentSet: FestivalSet | undefined;
  nextSet: FestivalSet | undefined;
  direction: "left" | "right" | null;
  onSwipe: (direction: "left" | "right") => void;
  onDragUpdate: (direction: "left" | "right" | null, intensity: number) => void;
  isLastSet: boolean;
}

export function CardStackContainer({
  currentSet,
  // nextSet,
  direction,
  onSwipe,
  onDragUpdate,
  // isLastSet,
}: CardStackContainerProps) {
  return (
    <div className="relative flex-1 px-4 pb-32">
      <div className="relative h-[60vh] max-w-sm mx-auto">
        <AnimatePresence mode="wait">
          {currentSet && (
            <motion.div
              key={currentSet.id}
              initial={{
                scale: 0.8,
                opacity: 0,
                rotateY: direction === "left" ? -90 : 90,
              }}
              animate={{ scale: 1, opacity: 1, rotateY: 0 }}
              exit={{
                scale: 0.8,
                opacity: 0,
                x: direction === "left" ? -300 : 300,
                rotateZ: direction === "left" ? -30 : 30,
              }}
              transition={{
                duration: 0.3,
                ease: "easeOut",
              }}
              className="absolute inset-0"
            >
              <SetExploreCard
                set={currentSet}
                isFront
                onSwipe={onSwipe}
                onDragUpdate={onDragUpdate}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Preview next card
        {!isLastSet && nextSet && (
          <div className="absolute inset-0 -z-10 scale-95 opacity-50">
            <SetExploreCard set={nextSet} />
          </div>
        )} */}
      </div>
    </div>
  );
}
