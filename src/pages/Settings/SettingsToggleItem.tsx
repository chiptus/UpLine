import { ToggleGroupItem } from "@/components/ui/toggle-group";
import type { ReactNode } from "react";

export function SettingsToggleItem({
  value,
  ariaLabel,
  children,
}: {
  value: string;
  ariaLabel: string;
  children: ReactNode;
}) {
  return (
    <ToggleGroupItem
      value={value}
      aria-label={ariaLabel}
      className="gap-1.5 rounded-md border border-border px-3 py-1.5 text-sm text-muted-foreground data-[state=on]:border-accent data-[state=on]:bg-accent-soft data-[state=on]:font-medium data-[state=on]:text-accent-soft-foreground hover:bg-surface-active"
    >
      {children}
    </ToggleGroupItem>
  );
}
