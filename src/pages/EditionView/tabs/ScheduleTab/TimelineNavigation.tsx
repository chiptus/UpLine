import { Button } from "@/components/ui/button";
import { Clock, Sun, Sunset } from "lucide-react";
import { StageFilterButtons } from "./StageFilterButtons";

interface TimelineNavigationProps {
  selectedStages: string[];
  onStageToggle: (stageId: string) => void;
  onJumpToToday?: () => void;
  onJumpToTime?: (timeOfDay: "morning" | "afternoon" | "evening") => void;
}

export function TimelineNavigation({
  selectedStages,
  onStageToggle,
  onJumpToToday,
  onJumpToTime,
}: TimelineNavigationProps) {
  function handleJumpToNow() {
    onJumpToToday?.();
  }

  function handleJumpToTime(timeOfDay: "morning" | "afternoon" | "evening") {
    onJumpToTime?.(timeOfDay);
  }

  return (
    <div className="space-y-4">
      {/* Quick Navigation */}
      <div>
        <h4 className="text-sm font-medium text-purple-200 mb-3">
          Quick Navigation
        </h4>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleJumpToNow}
            className="border-purple-400 text-purple-400 hover:bg-purple-400 hover:text-white"
          >
            <Clock className="h-3 w-3 mr-2" />
            Jump to Now
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleJumpToTime("morning")}
            className="border-purple-400 text-purple-400 hover:bg-purple-400 hover:text-white"
          >
            <Sun className="h-3 w-3 mr-2" />
            Morning
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleJumpToTime("afternoon")}
            className="border-purple-400 text-purple-400 hover:bg-purple-400 hover:text-white"
          >
            <Clock className="h-3 w-3 mr-2" />
            Afternoon
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleJumpToTime("evening")}
            className="border-purple-400 text-purple-400 hover:bg-purple-400 hover:text-white"
          >
            <Sunset className="h-3 w-3 mr-2" />
            Evening
          </Button>
        </div>
      </div>

      <div>
        <h4 className="text-sm font-medium text-purple-200 mb-3">Filters</h4>
        <StageFilterButtons
          selectedStages={selectedStages}
          onStageToggle={onStageToggle}
        />
      </div>
    </div>
  );
}
