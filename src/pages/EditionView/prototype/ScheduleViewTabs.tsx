// PROTOTYPE — slim underline text tabs for the "tabs" variant: always
// visible, same spot on every schedule view. See chromeVariant.tsx.
import { Calendar, List, Radio } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { useFestivalPhase } from "@/hooks/useFestivalPhase";
import { useScheduleReveal } from "@/hooks/useScheduleReveal";

const VIEWS = [
  { view: "now", to: "./now", label: "Now", icon: Radio },
  { view: "timeline", to: "./timeline", label: "Timeline", icon: Calendar },
  { view: "list", to: "./list", label: "List", icon: List },
] as const;

export function ScheduleViewTabs() {
  const { phase } = useFestivalPhase();
  const { canShowTime } = useScheduleReveal();
  const showNow = phase === "live" && canShowTime;

  const views = showNow ? VIEWS : VIEWS.filter((item) => item.view !== "now");

  return (
    <div
      role="navigation"
      aria-label="Schedule view"
      className="flex items-center gap-1 border-b border-purple-400/20"
    >
      {views.map(({ view, to, label, icon: Icon }) => (
        <Link
          key={view}
          from="/festivals/$festivalSlug/editions/$editionSlug/schedule"
          to={to}
          className="-mb-px flex items-center gap-1.5 border-b-2 px-3 py-2 text-sm font-medium transition-colors"
          activeProps={{ className: "border-purple-500 text-white" }}
          inactiveProps={{
            className:
              "border-transparent text-purple-300 hover:border-purple-400/40 hover:text-purple-100",
          }}
        >
          <Icon className="h-4 w-4" />
          {label}
        </Link>
      ))}
    </div>
  );
}
