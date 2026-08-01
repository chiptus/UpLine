import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";

interface RefreshButtonProps {
  onRefresh: () => void;
}

export function RefreshButton({ onRefresh }: RefreshButtonProps) {
  return (
    <Button
      variant="outline"
      size="sm"
      onClick={onRefresh}
      className="text-orange-300 border-orange-400/50 hover:bg-orange-400/20 hover:text-orange-200 flex items-center gap-2"
    >
      <RefreshCw className="h-4 w-4" />
      <span className="hidden md:inline">Refresh</span>
    </Button>
  );
}
