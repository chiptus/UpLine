import { Link, useParams } from "@tanstack/react-router";
import { isNonMusicSetType } from "@/api/sets/types";
import { SetTypeIcon } from "@/components/SetTypeIcon";
import { cn } from "@/lib/utils";
import type { ScheduleSet } from "@/hooks/useScheduleData";

interface SetHeaderProps {
  set: ScheduleSet;
}

export function SetHeader({ set }: SetHeaderProps) {
  const { festivalSlug, editionSlug } = useParams({
    from: "/festivals/$festivalSlug/editions/$editionSlug",
  });
  const isNonMusicSet = isNonMusicSetType(set.setType);

  return (
    <div className={cn("mb-2", isNonMusicSet && "flex items-center gap-1.5")}>
      <SetTypeIcon setType={set.setType} className="h-3.5 w-3.5" />
      <Link
        to="/festivals/$festivalSlug/editions/$editionSlug/sets/$setSlug"
        params={{ festivalSlug, editionSlug, setSlug: set.slug ?? "" }}
        className={cn(
          "text-foreground font-semibold hover:text-subtle-foreground transition-colors block text-sm whitespace-nowrap overflow-hidden text-ellipsis",
          isNonMusicSet && "min-w-0 flex-1",
        )}
      >
        {set.name}
      </Link>
    </div>
  );
}
