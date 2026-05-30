import { useScheduleReveal } from "@/hooks/useScheduleReveal";

const COPY: Record<"draft" | "days" | "stages", string> = {
  draft: "Schedule not yet published.",
  days: "Day-by-day lineup is out — exact times coming soon.",
  stages: "Stages assigned — exact times coming soon.",
};

export function ScheduleNotRevealedPlaceholder() {
  const { level } = useScheduleReveal();
  const copy = level === "full" ? COPY.draft : COPY[level];
  return (
    <div className="text-center text-purple-300 py-12">
      <p>{copy}</p>
    </div>
  );
}
