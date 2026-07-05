import { cn } from "@/lib/utils";

interface FestivalTimeHintProps {
  timezone?: string;
  className?: string;
}

export function FestivalTimeHint({ timezone, className }: FestivalTimeHintProps) {
  if (!timezone) return null;

  return (
    <span className={cn("w-full text-xs text-purple-200/70", className)}>
      Times in {timezone}
    </span>
  );
}
