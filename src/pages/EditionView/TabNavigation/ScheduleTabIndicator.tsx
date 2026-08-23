import { useScheduleReveal } from "@/hooks/useScheduleReveal";

export function ScheduleTabIndicator() {
  const { canShowTime } = useScheduleReveal();
  if (canShowTime) return null;
  return (
    <span
      aria-label="Schedule not fully revealed"
      title="Schedule not yet fully revealed"
      className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-notice"
    />
  );
}
