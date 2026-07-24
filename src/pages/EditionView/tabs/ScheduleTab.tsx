import { ScheduleNavigation } from "./ScheduleTab/ScheduleNavigation";
import { Outlet } from "@tanstack/react-router";
import { useFestivalEdition } from "@/contexts/FestivalEditionContext";
import { PageTitle } from "@/components/PageTitle/PageTitle";
// PROTOTYPE: chrome-variant exploration (see ../prototype/)
import { useChromeVariant } from "../prototype/chromeVariant";
import { ScheduleViewTabs } from "../prototype/ScheduleViewTabs";
import { ThumbDockNavigation } from "../prototype/ThumbDockNavigation";

export function ScheduleTab() {
  const { festival } = useFestivalEdition();
  const variant = useChromeVariant();

  return (
    <>
      <PageTitle title="Schedule" prefix={festival?.name} />
      <div className="space-y-3 md:space-y-6">
        {variant === "current" && <ScheduleNavigation />}
        {variant === "tabs" && <ScheduleViewTabs />}
        {variant === "thumbbar" && <ThumbDockNavigation />}

        <Outlet />
      </div>
    </>
  );
}
