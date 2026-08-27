import { asSetType, isNonMusicSetType } from "@/api/sets/types";
import { getSetTypeLabel } from "@/lib/setTypeLabels";
import { cn } from "@/lib/utils";

interface SetTypeIconProps {
  setType: string | null;
  className?: string;
}

export function SetTypeIcon({ setType, className }: SetTypeIconProps) {
  if (!isNonMusicSetType(asSetType(setType))) {
    return null;
  }

  const { icon: Icon, label } = getSetTypeLabel(setType);
  return (
    <Icon
      aria-label={label}
      className={cn("shrink-0 text-muted-foreground", className)}
    />
  );
}
