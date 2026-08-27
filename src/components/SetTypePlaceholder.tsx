import { getSetTypeLabel } from "@/lib/setTypeLabels";
import { cn } from "@/lib/utils";

interface SetTypePlaceholderProps {
  setType: string | null;
  className?: string;
  iconClassName?: string;
}

export function SetTypePlaceholder({
  setType,
  className,
  iconClassName = "h-24 w-24",
}: SetTypePlaceholderProps) {
  const { icon: Icon, gradient } = getSetTypeLabel(setType);
  return (
    <div
      className={cn(
        "flex items-center justify-center rounded-lg bg-gradient-to-br",
        gradient,
        className,
      )}
    >
      <Icon className={cn("text-foreground/40", iconClassName)} />
    </div>
  );
}
