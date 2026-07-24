// PROTOTYPE — slim dropdown view switcher tried on the "compact" variant
// (the "commandbar" variant keeps the 3-icon strip for comparison).
import { Calendar, ChevronDown, List, Radio } from "lucide-react";
import { Link, useLocation } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useFestivalPhase } from "@/hooks/useFestivalPhase";
import { useScheduleReveal } from "@/hooks/useScheduleReveal";

const VIEWS = [
  { view: "now", to: "./now", label: "Now", icon: Radio },
  { view: "timeline", to: "./timeline", label: "Timeline", icon: Calendar },
  { view: "list", to: "./list", label: "List", icon: List },
] as const;

export function ViewMenu() {
  const { phase } = useFestivalPhase();
  const { canShowTime } = useScheduleReveal();
  const { pathname } = useLocation();
  const showNow = phase === "live" && canShowTime;

  const views = showNow ? VIEWS : VIEWS.filter((item) => item.view !== "now");
  const current =
    views.find((item) => pathname.endsWith(`/${item.view}`)) ?? views[0];
  const CurrentIcon = current.icon;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          aria-label={`Change view (current: ${current.label})`}
          className="gap-1 px-2 text-purple-100 hover:bg-white/10 hover:text-white"
        >
          <CurrentIcon className="h-4 w-4" />
          <ChevronDown className="h-3.5 w-3.5 text-purple-300" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="start"
        className="border-purple-400/30 bg-gray-900"
      >
        {views.map(({ view, to, label, icon: Icon }) => (
          <DropdownMenuItem
            key={view}
            asChild
            className={
              view === current.view
                ? "bg-purple-600/40 text-white focus:bg-purple-600/50 focus:text-white"
                : "text-purple-100 focus:bg-white/10 focus:text-white"
            }
          >
            <Link
              from="/festivals/$festivalSlug/editions/$editionSlug/schedule"
              to={to}
            >
              <Icon className="mr-2 h-4 w-4" />
              {label}
            </Link>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
