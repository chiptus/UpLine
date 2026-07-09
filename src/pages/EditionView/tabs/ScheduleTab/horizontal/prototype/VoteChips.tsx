// PROTOTYPE (timeline nav & filtering) — throwaway, delete with this folder.
import { VOTE_CONFIG, VOTES_TYPES, type VoteType } from "@/lib/voteConfig";
import { cn } from "@/lib/utils";

interface VoteChipsProps {
  selected: VoteType[];
  onToggle: (voteType: VoteType) => void;
  compact?: boolean;
  counts?: Partial<Record<VoteType, number>>;
}

export function VoteChips({
  selected,
  onToggle,
  compact,
  counts,
}: VoteChipsProps) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {VOTES_TYPES.map((voteType) => {
        const config = VOTE_CONFIG[voteType];
        const Icon = config.icon;
        const isSelected = selected.includes(voteType);
        return (
          <button
            key={voteType}
            type="button"
            onClick={() => onToggle(voteType)}
            aria-pressed={isSelected}
            title={config.label}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full border text-xs font-medium transition-colors",
              compact ? "px-2 py-1" : "px-3 py-1.5",
              isSelected
                ? cn("border-transparent text-white", config.buttonSelected)
                : cn("bg-transparent", config.buttonUnselected),
            )}
          >
            <Icon className="h-3.5 w-3.5" />
            {!compact && <span>{config.label}</span>}
            {!compact && counts?.[voteType] !== undefined && (
              <span
                className={cn(
                  "rounded-full px-1.5",
                  isSelected ? "bg-white/25" : "bg-white/10",
                )}
              >
                {counts[voteType]}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
