import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Archive } from "lucide-react";
import {
  type DiffResult,
  type OrphanResolution,
} from "@/services/scheduleImportService";

type OrphanedSet = DiffResult["conflicts"]["orphanedSets"][number];

type Props = {
  orphanedSets: OrphanedSet[];
  resolutions: Record<string, OrphanResolution>;
  onChange: (setId: string, resolution: OrphanResolution) => void;
};

export function OrphanedSetsPanel({
  orphanedSets,
  resolutions,
  onChange,
}: Props) {
  if (orphanedSets.length === 0) return null;

  function allArchived() {
    return orphanedSets.every(
      (s) => (resolutions[s.id] ?? "keep") === "archive",
    );
  }

  function toggleAll() {
    const target: OrphanResolution = allArchived() ? "keep" : "archive";
    orphanedSets.forEach((s) => onChange(s.id, target));
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-medium">
          <Archive className="h-4 w-4 text-muted-foreground" />
          {orphanedSets.length} set{orphanedSets.length !== 1 ? "s" : ""} not in
          CSV
        </div>
        <Button variant="ghost" size="sm" onClick={toggleAll}>
          {allArchived() ? "Keep all" : "Archive all"}
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
            resolution={resolutions[set.id] ?? "keep"}
            onChange={(resolution) => onChange(set.id, resolution)}
          />
        ))}
      </div>
    </div>
  );
}

type OrphanedItemProps = {
  set: OrphanedSet;
  resolution: OrphanResolution;
  onChange: (resolution: OrphanResolution) => void;
};

function OrphanedItem({ set, resolution, onChange }: OrphanedItemProps) {
  const isArchive = resolution === "archive";
  const time = formatTime(set.timeStart);
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

function formatTime(iso: string | null) {
  if (!iso) return null;
  return new Date(iso).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
