import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { VOTES_TYPES, VOTE_CONFIG, type VoteType } from "@/lib/voteConfig";
import { useAuth } from "@/contexts/AuthContext";
import { useTimelineUrlState } from "@/hooks/useTimelineUrlState";

interface VoteFilterChipsProps {
  tab: "timeline" | "list";
}

/**
 * Compact icon-only chips for the three Vote types (Must Go / Interested /
 * Won't Go), letting the viewer filter both Schedule views down to sets
 * they voted on themselves. Pairs with the ScheduleFilterSheet trigger
 * (rendered as a sibling, not inside the sheet) in both the Timeline
 * toolbar and the List view's filter row.
 *
 * Selection is OR-ed and lives in the shared URL state
 * (`useTimelineUrlState`), so it counts toward ScheduleFilterSheet's badge
 * and stays in sync across views. Always the viewer's own votes - group-vote
 * scopes are out of scope.
 *
 * Hidden entirely for logged-out visitors: no disabled state, no login
 * teaser, just absent.
 */
export function VoteFilterChips({ tab }: VoteFilterChipsProps) {
  const { user } = useAuth();
  const { votes, updateVotes } = useTimelineUrlState(tab);

  if (!user) {
    return null;
  }

  return (
    <div data-testid="vote-filter-chips" className="flex items-center gap-1">
      {VOTES_TYPES.map((voteType) => {
        const config = VOTE_CONFIG[voteType];
        const Icon = config.icon;
        const isSelected = votes.includes(voteType);

        return (
          <Button
            key={voteType}
            type="button"
            variant="ghost"
            size="icon"
            aria-pressed={isSelected}
            aria-label={config.label}
            data-testid={`vote-filter-chip-${voteType}`}
            onClick={() => handleToggle(voteType)}
            className={cn(
              "h-8 w-8",
              isSelected
                ? `${config.circleColor} text-white hover:opacity-90`
                : `${config.iconColor} hover:bg-white/10`,
            )}
          >
            <Icon className="h-4 w-4" />
          </Button>
        );
      })}
    </div>
  );

  function handleToggle(voteType: VoteType) {
    const next = votes.includes(voteType)
      ? votes.filter((selected) => selected !== voteType)
      : [...votes, voteType];
    updateVotes(next);
  }
}
