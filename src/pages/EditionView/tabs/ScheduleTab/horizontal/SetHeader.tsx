import { Link } from "@tanstack/react-router";
import type { ScheduleSet } from "@/hooks/useScheduleData";

interface SetHeaderProps {
  set: ScheduleSet;
}

export function SetHeader({ set }: SetHeaderProps) {
  return (
    <div className="mb-2">
      <Link
        to={`../../sets/${set.slug}`}
        className="text-white font-semibold hover:text-purple-300 transition-colors block text-sm whitespace-nowrap overflow-hidden text-ellipsis"
      >
        {set.name}
      </Link>
    </div>
  );
}
