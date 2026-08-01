import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, CalendarDays, Info } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface FestivalModeToggleProps {
  onModeChange: (isFestivalMode: boolean) => void;
}

export function FestivalModeToggle({ onModeChange }: FestivalModeToggleProps) {
  const [isFestivalMode, setIsFestivalMode] = useState(() => {
    const saved = localStorage.getItem("festival-mode");
    if (saved !== null) return JSON.parse(saved);

    // Auto-detect based on current date (example festival dates)
    const now = new Date();
    const festivalStart = new Date("2024-07-20"); // Example dates
    const festivalEnd = new Date("2024-07-27");
    return now >= festivalStart && now <= festivalEnd;
  });

  useEffect(() => {
    localStorage.setItem("festival-mode", JSON.stringify(isFestivalMode));
    onModeChange(isFestivalMode);
  }, [isFestivalMode, onModeChange]);

  function toggleMode() {
    setIsFestivalMode(!isFestivalMode);
  }

  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-2">
        <Button
          variant={isFestivalMode ? "default" : "outline"}
          size="sm"
          onClick={toggleMode}
          className={
            isFestivalMode
              ? "bg-orange-600 hover:bg-orange-700 text-white border-orange-600"
              : "border-purple-400 text-purple-400 hover:bg-purple-400 hover:text-white"
          }
        >
          {isFestivalMode ? (
            <CalendarDays className="h-4 w-4 mr-2" />
          ) : (
            <Calendar className="h-4 w-4 mr-2" />
          )}
          {isFestivalMode ? "Festival Mode" : "Planning Mode"}
        </Button>

        {isFestivalMode && (
          <Badge
            variant="secondary"
            className="bg-orange-100 text-orange-800 border-orange-200"
          >
            Live
          </Badge>
        )}
      </div>

      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="ghost" size="sm" className="p-1 h-6 w-6">
            <Info className="h-3 w-3 text-purple-400" />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="max-w-xs">
          <div className="space-y-1 text-xs">
            <p>
              <strong>Festival Mode:</strong> Timeline view recommended for live
              schedule tracking
            </p>
            <p>
              <strong>Planning Mode:</strong> Artists list with sorting for
              pre-festival planning
            </p>
          </div>
        </TooltipContent>
      </Tooltip>
    </div>
  );
}
