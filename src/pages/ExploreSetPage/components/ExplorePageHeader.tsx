import { Link, useParams } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { ExplorationProgress } from "../ExplorationProgress";
import { ProgressInfoTooltip } from "./ProgressInfoTooltip";

interface ExplorePageHeaderProps {
  editionName: string;
  currentIndex: number;
  totalSets: number;
  votedCount: number;
  nonExplorableCount: number;
  skippedCount: number;
}

export function ExplorePageHeader({
  editionName,
  currentIndex,
  totalSets,
  votedCount,
  nonExplorableCount,
  skippedCount,
}: ExplorePageHeaderProps) {
  const { festivalSlug, editionSlug } = useParams({ strict: false });

  return (
    <div className="relative z-10 p-4 flex items-center justify-between">
      <div className="flex-1 flex justify-start">
        <Button
          asChild
          variant="ghost"
          size="sm"
          className="text-white hover:bg-white/20 flex items-center "
        >
          <Link
            to="/festivals/$festivalSlug/editions/$editionSlug/sets"
            params={{ festivalSlug: festivalSlug!, editionSlug: editionSlug! }}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Back</span>
          </Link>
        </Button>
      </div>

      <div className="text-center text-white">
        <h1 className="font-semibold">{editionName}</h1>
        <ExplorationProgress current={currentIndex + 1} total={totalSets} />
      </div>

      <div className="flex-1 flex justify-end">
        <ProgressInfoTooltip
          current={currentIndex + 1}
          total={totalSets}
          votedCount={votedCount}
          nonExplorableCount={nonExplorableCount}
          skippedCount={skippedCount}
        />
      </div>
    </div>
  );
}
