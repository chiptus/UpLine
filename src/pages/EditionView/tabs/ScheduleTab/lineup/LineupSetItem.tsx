import { Link, useParams } from "@tanstack/react-router";
import { Card, CardContent } from "@/components/ui/card";
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
        {set.slug ? (
          <Link
            to="/festivals/$festivalSlug/editions/$editionSlug/sets/$setSlug"
            params={{ festivalSlug, editionSlug, setSlug: set.slug }}
            className="text-foreground font-semibold hover:text-subtle-foreground transition-colors block text-lg mb-2"
          >
            {set.name}
          </Link>
        ) : (
          <span className="text-foreground font-semibold block text-lg mb-2">
            {set.name}
          </span>
        )}
        <VoteButtons set={set} />
      </CardContent>
    </Card>
  );
}
