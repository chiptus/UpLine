import { Globe } from "lucide-react";
import { ScheduleNavigation } from "./ScheduleTab/ScheduleNavigation";
import { Outlet } from "@tanstack/react-router";
import { useFestivalEdition } from "@/contexts/FestivalEditionContext";
import { PageTitle } from "@/components/PageTitle/PageTitle";

export function ScheduleTab() {
  const { festival } = useFestivalEdition();

  return (
    <>
      <PageTitle title="Schedule" prefix={festival?.name} />
      <div className="space-y-3 md:space-y-6">
        <ScheduleNavigation />

        <div className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-amber-400/20 border border-amber-400/40 text-amber-100">
          <Globe className="h-4 w-4 shrink-0" />
          <span className="text-sm font-medium">
            All times in festival time · {festival.timezone}
          </span>
        </div>

        <Outlet />
      </div>
    </>
  );
}
