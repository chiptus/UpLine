import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { VOTES_TYPES, VOTE_CONFIG, type VoteType } from "@/lib/voteConfig";
import { useAuth } from "@/contexts/AuthContext";
import { useTimelineUrlState } from "@/hooks/useTimelineUrlState";

interface VoteFilterChipsProps {
  tab: "timeline" | "list";
}

/**
 * Icon-only chips that filter both Schedule views to sets the viewer voted
 * on. OR-ed selection lives in shared URL state; hidden when logged out.
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
