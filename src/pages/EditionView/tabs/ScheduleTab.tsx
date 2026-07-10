import { ScheduleNavigation } from "./ScheduleTab/ScheduleNavigation";
import { NowNextSection } from "./ScheduleTab/NowNextSection";
import { Outlet } from "@tanstack/react-router";
import { useFestivalEdition } from "@/contexts/FestivalEditionContext";
import { PageTitle } from "@/components/PageTitle/PageTitle";

export function ScheduleTab() {
  const { festival } = useFestivalEdition();

  return (
    <>
      <PageTitle title="Schedule" prefix={festival?.name} />
      <div className="space-y-3 md:space-y-6">
        <NowNextSection />

        <ScheduleNavigation />

        <Outlet />
      </div>
    </>
  );
}
