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
