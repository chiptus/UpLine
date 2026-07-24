import { ScheduleNavigation } from "./ScheduleTab/ScheduleNavigation";
import { Outlet } from "@tanstack/react-router";
import { useFestivalEdition } from "@/contexts/FestivalEditionContext";
import { PageTitle } from "@/components/PageTitle/PageTitle";
// PROTOTYPE: chrome-variant exploration (see ../prototype/)
import { useChromeVariant } from "../prototype/chromeVariant";

export function ScheduleTab() {
  const { festival } = useFestivalEdition();
  const variant = useChromeVariant();
  const showNavigation = variant === "current" || variant === "quiet";

  return (
    <>
      <PageTitle title="Schedule" prefix={festival?.name} />
      <div className="space-y-3 md:space-y-6">
        {showNavigation && <ScheduleNavigation />}

        <Outlet />
      </div>
    </>
  );
}
