import { Link, useParams } from "@tanstack/react-router";
import { Card, CardContent } from "@/components/ui/card";
import { isNonMusicSetType } from "@/api/sets/types";
import { SetTypeIcon } from "@/components/SetTypeIcon";
import { cn } from "@/lib/utils";
import { VoteButtons } from "../VoteButtons";
import type { ScheduleSet } from "@/hooks/useScheduleData";

interface LineupSetItemProps {
  set: ScheduleSet;
}

export function LineupSetItem({ set }: LineupSetItemProps) {
  const { festivalSlug, editionSlug } = useParams({
    from: "/festivals/$festivalSlug/editions/$editionSlug",
  });

  return (
    <Card className="bg-surface-raised backdrop-blur-md border-border hover:border-strong transition-colors">
      <CardContent className="p-4">
        <div
          className={cn(
            isNonMusicSetType(set.setType) && "flex items-center gap-2 mb-2",
          )}
        >
          <SetTypeIcon setType={set.setType} className="h-4 w-4" />
          {set.slug ? (
            <Link
              to="/festivals/$festivalSlug/editions/$editionSlug/sets/$setSlug"
              params={{ festivalSlug, editionSlug, setSlug: set.slug }}
              className={cn(
                "text-foreground font-semibold hover:text-subtle-foreground transition-colors block text-lg",
                isNonMusicSetType(set.setType) ? "min-w-0" : "mb-2",
              )}
            >
              {set.name}
            </Link>
          ) : (
            <span
              className={cn(
                "text-foreground font-semibold block text-lg",
                isNonMusicSetType(set.setType) ? "min-w-0" : "mb-2",
              )}
            >
              {set.name}
            </span>
          )}
        </div>
        <VoteButtons set={set} />
      </CardContent>
    </Card>
  );
}
