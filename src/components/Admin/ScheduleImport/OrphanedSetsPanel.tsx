import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Archive } from "lucide-react";
import { formatDateTime } from "@/lib/timeUtils";
import {
  type DiffResult,
  type OrphanResolution,
} from "@/services/scheduleImport/types";

type OrphanedSet = DiffResult["conflicts"]["orphanedSets"][number];

type Props = {
  orphanedSets: OrphanedSet[];
  timezone: string;
  resolutions: Record<string, OrphanResolution>;
  onChange: (setId: string, resolution: OrphanResolution) => void;
};

export function OrphanedSetsPanel({
  orphanedSets,
  timezone,
  resolutions,
  onChange,
}: Props) {
  if (orphanedSets.length === 0) return null;

  const everyArchived = orphanedSets.every(
    (s) => (resolutions[s.id] ?? "keep") === "archive",
  );

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-medium">
          <Archive className="h-4 w-4 text-muted-foreground" />
          {orphanedSets.length} set{orphanedSets.length !== 1 ? "s" : ""} not in
          CSV
        </div>
        <Button variant="ghost" size="sm" onClick={toggleAll}>
          {everyArchived ? "Keep all" : "Archive all"}
        </Button>
      </div>

      <p className="text-xs text-muted-foreground">
        These sets exist in the database but were not matched to any row in your
        CSV. Archived sets are hidden from users but votes are preserved.
        Default: <span className="font-medium">Keep</span>.
      </p>

      <div className="divide-y rounded-lg border">
        {orphanedSets.map((set) => (
          <OrphanedItem
            key={set.id}
            set={set}
            timezone={timezone}
            resolution={resolutions[set.id] ?? "keep"}
            onChange={(resolution) => onChange(set.id, resolution)}
          />
        ))}
      </div>
    </div>
  );

  function toggleAll() {
    const target: OrphanResolution = everyArchived ? "keep" : "archive";
    orphanedSets.forEach((s) => onChange(s.id, target));
  }
}

type OrphanedItemProps = {
  set: OrphanedSet;
  timezone: string;
  resolution: OrphanResolution;
  onChange: (resolution: OrphanResolution) => void;
};

function OrphanedItem({
  set,
  timezone,
  resolution,
  onChange,
}: OrphanedItemProps) {
  const isArchive = resolution === "archive";
  // Format in the festival timezone so review decisions don't flip across
  // midnight/DST for admins in a different timezone than the festival.
  const time = formatDateTime(set.timeStart, false, timezone);
  const switchId = `orphan-${set.id}`;

  return (
    <div className="flex items-center justify-between px-4 py-3">
      <div className="min-w-0">
        <p className="text-sm font-medium truncate">{set.name}</p>
        <p className="text-xs text-muted-foreground">
          {[set.stage, time].filter(Boolean).join(" · ") || "No schedule info"}
        </p>
      </div>
      <div className="flex items-center gap-2 ml-4 shrink-0">
        <Label htmlFor={switchId} className="text-xs text-muted-foreground">
          {isArchive ? "Archive" : "Keep"}
        </Label>
        <Switch
          id={switchId}
          checked={isArchive}
          onCheckedChange={(checked) => onChange(checked ? "archive" : "keep")}
        />
      </div>
    </div>
  );
}
