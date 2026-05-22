import { Badge } from "@/components/ui/badge";
import { type DiffResult } from "@/services/scheduleImport/types";

type Props = { diff: DiffResult };

export function DiffSummaryBanner({ diff }: Props) {
  const { summary, newArtistNames } = diff;

  const items = [
    {
      label: "sets to create",
      value: summary.setsToCreate,
      variant: "default" as const,
    },
    {
      label: "sets to update",
      value: summary.setsMatched,
      variant: "secondary" as const,
    },
    {
      label: "new stages",
      value: summary.newStages,
      variant: "default" as const,
    },
    {
      label: "conflicts",
      value: summary.setsOrphaned + diff.conflicts.stageNameMismatches.length,
      variant: "destructive" as const,
    },
  ].filter((item) => item.value > 0);

  return (
    <div className="rounded-lg border bg-muted/40 p-4 space-y-3">
      <div className="flex flex-wrap gap-2">
        {items.map((item) => (
          <Badge key={item.label} variant={item.variant}>
            {item.value} {item.label}
          </Badge>
        ))}
        {items.length === 0 && (
          <span className="text-sm text-muted-foreground">
            No changes detected.
          </span>
        )}
      </div>

      {summary.newArtists > 0 && (
        <p className="text-sm text-muted-foreground">
          <span className="font-medium text-foreground">
            {summary.newArtists} new artist{summary.newArtists !== 1 ? "s" : ""}
          </span>{" "}
          will be created: {newArtistNames.slice(0, 5).join(", ")}
          {newArtistNames.length > 5 &&
            ` and ${newArtistNames.length - 5} more`}
          .
        </p>
      )}
    </div>
  );
}
