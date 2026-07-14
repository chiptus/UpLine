import { Button } from "@/components/ui/button";

interface NowButtonProps {
  onJumpToNow: () => void;
}

/**
 * The "Now" pill in the day-jump toolbar. Rendered only while the current
 * time (festival timezone) falls inside the festival window - see
 * `isNowWithinFestivalWindow` - never disabled, just absent otherwise.
 */
export function NowButton({ onJumpToNow }: NowButtonProps) {
  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      data-testid="now-jump-button"
      className="shrink-0 rounded-full border-fuchsia-400/40 text-fuchsia-100 hover:bg-fuchsia-400 hover:text-white"
      onClick={onJumpToNow}
    >
      Now
    </Button>
  );
}
