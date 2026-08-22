import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@radix-ui/react-popover";
import { Info } from "lucide-react";

export function ProgressInfoTooltip({
  current,
  total,
  votedCount,
  nonExplorableCount,
  skippedCount,
}: {
  current: number;
  total: number;
  votedCount: number;
  nonExplorableCount: number;
  skippedCount: number;
}) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="text-foreground/60 hover:text-foreground hover:bg-surface-active"
        >
          <Info className="h-4 w-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="bg-gray-900 border-gray-700 text-foreground px-3 py-2 rounded-sm shadow-md"
        side="bottom"
        align="end"
      >
        <div className="space-y-2">
          <h4 className="font-semibold text-sm">Progress Details</h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-subtle-foreground mr-1">
                Already voted:
              </span>
              <span>{votedCount}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-subtle-foreground mr-1">Skipped:</span>
              <span>{skippedCount}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-subtle-foreground mr-1">
                No SoundCloud:
              </span>
              <span>{nonExplorableCount}</span>
            </div>
            <div className="border-t border-gray-700 pt-2 mt-2">
              <div className="flex justify-between">
                <span className="text-subtle-foreground mr-1">Current:</span>
                <span>{current}</span>
              </div>
              <div className="flex justify-between mt-1">
                <span className="text-subtle-foreground mr-1">Total:</span>
                <span>{total}</span>
              </div>
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
