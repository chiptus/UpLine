import { Link } from "@tanstack/react-router";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

const VIEW_TO = {
  now: "./now",
  timeline: "./timeline",
  list: "./list",
} as const;

interface ScheduleNavigationItemProps {
  view: keyof typeof VIEW_TO;
  label: string;
  icon: LucideIcon;
}

export function ScheduleNavigationItem({
  view,
  label,
  icon: Icon,
}: ScheduleNavigationItemProps) {
  return (
    <Link
      from="/festivals/$festivalSlug/editions/$editionSlug/schedule"
      to={VIEW_TO[view]}
      activeProps={{
        className: cn(
          `flex gap-2 items-center justify-center  py-2 md:py-3 rounded-lg
           flex-1 md:min-w-[100px] transition-all duration-200 active:scale-95
           bg-accent text-accent-foreground shadow-lg`,
        ),
      }}
      inactiveProps={{
        className: cn(
          `flex gap-2 items-center justify-center  py-2 md:py-3 rounded-lg
           flex-1 md:min-w-[100px] transition-all duration-200 active:scale-95
           text-muted-foreground hover:text-foreground hover:bg-surface-raised`,
        ),
      }}
    >
      <Icon className="h-4 w-4" />
      <span className="font-medium">{label}</span>
    </Link>
  );
}
