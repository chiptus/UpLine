import { Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface TimeFormatToggleProps {
  use24Hour: boolean;
  onChange: (use24Hour: boolean) => void;
}

export function TimeFormatToggle({
  use24Hour,
  onChange,
}: TimeFormatToggleProps) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onChange(!use24Hour)}
            className={`flex items-center gap-2 ${
              use24Hour
                ? "bg-purple-600/50 text-purple-100 hover:bg-purple-600/60"
                : "text-purple-300 hover:text-purple-100"
            }`}
          >
            <Clock className="h-4 w-4" />
            <span className="text-sm font-medium">
              {use24Hour ? "24h" : "12h"}
            </span>
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>Switch to {use24Hour ? "12-hour" : "24-hour"} time format</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
