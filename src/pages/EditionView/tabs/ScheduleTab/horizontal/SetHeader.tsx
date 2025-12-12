import { Link, useParams } from "@tanstack/react-router";
import type { ScheduleSet } from "@/hooks/useScheduleData";

interface SetHeaderProps {
  set: ScheduleSet;
}

export function SetHeader({ set }: SetHeaderProps) {
  const { festivalSlug, editionSlug } = useParams();

  return (
    <div className="mb-2">
      <Link
        to="/festivals/$festivalSlug/editions/$editionSlug/sets/$setSlug"
        params={{ festivalSlug, editionSlug, setSlug: set.slug }}
        className="text-white font-semibold hover:text-purple-300 transition-colors block text-sm whitespace-nowrap overflow-hidden text-ellipsis"
      >
        {set.name}
      </Link>
    </div>
  );
}
