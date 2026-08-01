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
    <Card className="bg-white/10 backdrop-blur-md border-purple-400/30 hover:border-purple-400/50 transition-colors">
      <CardContent className="p-4">
        {set.slug ? (
          <Link
            to="/festivals/$festivalSlug/editions/$editionSlug/sets/$setSlug"
            params={{ festivalSlug, editionSlug, setSlug: set.slug }}
            className="text-white font-semibold hover:text-purple-300 transition-colors block text-lg mb-2"
          >
            {set.name}
          </Link>
        ) : (
          <span className="text-white font-semibold block text-lg mb-2">
            {set.name}
          </span>
        )}
        <VoteButtons set={set} />
      </CardContent>
    </Card>
  );
}
