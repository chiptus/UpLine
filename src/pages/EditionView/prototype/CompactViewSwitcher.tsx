// PROTOTYPE — icon-only Now/Timeline/List switcher used by the
// "commandbar" and "compact" chrome variants. See chromeVariant.tsx.
import { Calendar, List, Radio } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { useFestivalPhase } from "@/hooks/useFestivalPhase";
import { useScheduleReveal } from "@/hooks/useScheduleReveal";

const VIEWS = [
  { view: "now", to: "./now", label: "Now", icon: Radio },
  { view: "timeline", to: "./timeline", label: "Timeline", icon: Calendar },
  { view: "list", to: "./list", label: "List", icon: List },
] as const;

export function CompactViewSwitcher() {
  const { phase } = useFestivalPhase();
  const { canShowTime } = useScheduleReveal();
  const showNow = phase === "live" && canShowTime;

  const views = showNow ? VIEWS : VIEWS.filter((item) => item.view !== "now");

  return (
    <div
      role="navigation"
      aria-label="Schedule view"
      className="flex shrink-0 items-center gap-0.5 rounded-lg bg-white/10 p-0.5"
    >
      {views.map(({ view, to, label, icon: Icon }) => (
        <Link
          key={view}
          from="/festivals/$festivalSlug/editions/$editionSlug/schedule"
          to={to}
          aria-label={label}
          title={label}
          className="rounded-md p-2 transition-colors"
          activeProps={{ className: "bg-purple-600 text-white shadow" }}
          inactiveProps={{
            className: "text-purple-200 hover:bg-white/10 hover:text-white",
          }}
        >
          <Icon className="h-4 w-4" />
        </Link>
      ))}
    </div>
  );
}
