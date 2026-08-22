import { Button } from "@/components/ui/button";

interface NowButtonProps {
  onJumpToNow: () => void;
}

export function NowButton({ onJumpToNow }: NowButtonProps) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      data-testid="now-jump-button"
      className="shrink-0 gap-1.5 self-center text-live-foreground hover:bg-live/10 hover:text-live-foreground"
      onClick={onJumpToNow}
    >
      <span className="relative flex size-2">
        <span className="absolute inline-flex size-full animate-ping rounded-full bg-live opacity-75" />
        <span className="relative inline-flex size-2 rounded-full bg-live" />
      </span>
      Now
    </Button>
  );
}
