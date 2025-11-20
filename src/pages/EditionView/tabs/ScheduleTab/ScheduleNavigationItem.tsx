import { Link } from "@tanstack/react-router";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { useFestivalEdition } from "@/contexts/FestivalEditionContext";

interface ScheduleNavigationItemProps {
  view: "timeline" | "list";
  label: string;
  icon: LucideIcon;
}

export function ScheduleNavigationItem({
  view,
  label,
  icon: Icon,
}: ScheduleNavigationItemProps) {
  const { basePath } = useFestivalEdition();

  return (
    <Link
      to={`${basePath}/schedule/${view}`}
      activeProps={{
        className: cn(
          `flex gap-2 items-center justify-center  py-2 md:py-3 rounded-lg
           w-1/2 md:min-w-[100px] transition-all duration-200 active:scale-95
           bg-purple-600 text-white shadow-lg`,
        ),
      }}
      inactiveProps={{
        className: cn(
          `flex gap-2 items-center justify-center  py-2 md:py-3 rounded-lg
           w-1/2 md:min-w-[100px] transition-all duration-200 active:scale-95
           text-purple-200 hover:text-white hover:bg-white/10`,
        ),
      }}
    >
      <Icon className="h-4 w-4" />
      <span className="font-medium">{label}</span>
    </Link>
  );
}
