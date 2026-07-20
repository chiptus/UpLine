import { Button } from "@/components/ui/button";

interface NowButtonProps {
  onJumpToNow: () => void;
}

/**
 * The "Now" control anchored beside "Show overview", outside the scrolling
 * day row so it can't be scrolled out of view on narrow screens. Rendered
 * only while the current time (festival timezone) falls inside the festival
 * window - see `isNowWithinFestivalWindow` - never disabled, just absent
 * otherwise.
 */
export function NowButton({ onJumpToNow }: NowButtonProps) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      data-testid="now-jump-button"
      className="shrink-0 gap-1.5 self-center text-fuchsia-200 hover:bg-fuchsia-400/10 hover:text-fuchsia-100"
      onClick={onJumpToNow}
    >
      <span className="relative flex size-2">
        <span className="absolute inline-flex size-full animate-ping rounded-full bg-fuchsia-400 opacity-75" />
        <span className="relative inline-flex size-2 rounded-full bg-fuchsia-400" />
      </span>
      Now
    </Button>
  );
}
