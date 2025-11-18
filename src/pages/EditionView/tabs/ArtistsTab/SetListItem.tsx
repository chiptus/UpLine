import { SetHeader } from "./SetCard/SetHeader";
import { SetImage } from "./SetCard/SetImage";
import { SetMetadata } from "./SetCard/SetMetadata";
import { SetDescription } from "./SetCard/SetDescription";
import { SetVotingButtons } from "./SetCard/SetVotingButtons";
import { ConflictBadge } from "@/components/SchedulePhase/ConflictBadge";

interface SetListItemProps {
  conflictCount?: number;
  showScheduleInfo?: boolean;
}

export function SetListItem({
  conflictCount = 0,
  showScheduleInfo = false,
}: SetListItemProps) {
  return (
    <div
      className="bg-white/10 backdrop-blur-md border-purple-400/30 hover:bg-white/15 transition-all duration-300 rounded-lg p-4"
      data-testid="artist-item"
    >
      {/* Mobile Layout (sm and below) */}
      <div className="flex flex-col md:hidden space-y-3">
        <div className="flex items-start gap-3 relative">
          <SetImage size="sm" />
          <div className="flex-1 min-w-0">
            <SetHeader size="sm" />
            <div className="flex items-center gap-2 flex-wrap">
              <SetMetadata />
              {showScheduleInfo && conflictCount > 0 && (
                <ConflictBadge conflictCount={conflictCount} />
              )}
            </div>
          </div>
        </div>

        <SetDescription className="text-purple-200 text-sm" />

        <div className="self-end">
          <SetVotingButtons size="sm" layout="horizontal" />
        </div>
      </div>

      {/* Desktop Layout (md and above) */}
      <div className="hidden md:flex items-center gap-4 relative">
        <SetImage size="md" />

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between mb-2">
            <div className="flex-1 min-w-0">
              <SetHeader size="sm" />

              <div className="flex items-center gap-2 flex-wrap">
                <SetMetadata />
                {showScheduleInfo && conflictCount > 0 && (
                  <ConflictBadge conflictCount={conflictCount} />
                )}
              </div>
            </div>
          </div>

          <SetDescription className="text-purple-200 text-sm line-clamp-2 mb-2" />
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          <SetVotingButtons size="sm" layout="horizontal" />
        </div>
      </div>
    </div>
  );
}
