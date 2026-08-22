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
                ? "bg-accent-soft text-foreground hover:bg-accent-soft"
                : "text-subtle-foreground hover:text-foreground"
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
