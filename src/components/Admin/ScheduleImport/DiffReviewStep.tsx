import { AlertCircle, AlertTriangle, Loader2 } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  type DiffResult,
  type StageMismatchResolution,
  type OrphanResolution,
} from "@/services/scheduleImport/types";
import type { RevealLevel } from "@/lib/scheduleReveal";
import { DiffSummaryBanner } from "./DiffSummaryBanner";
import { StageMismatchResolver } from "./StageMismatchResolver";
import { OrphanedSetsPanel } from "./OrphanedSetsPanel";

type DbStage = { id: string; name: string };

type Props = {
  diff: DiffResult;
  timezone: string;
  dbStages: DbStage[];
  stageMismatchResolutions: Record<string, StageMismatchResolution>;
  orphanResolutions: Record<string, OrphanResolution>;
  onStageMismatchChange: (
    csvValue: string,
    resolution: StageMismatchResolution,
  ) => void;
  onOrphanChange: (setId: string, resolution: OrphanResolution) => void;
  onCommit: () => void;
  onReset: () => void;
  committing: boolean;
  commitError: string | null;
  canCommit: boolean;
  currentRevealLevel: RevealLevel;
};

const LEVEL_DESCRIPTION: Record<RevealLevel, string> = {
  draft: "draft (not visible to the public)",
  days: "days revealed",
  stages: "stages revealed",
  full: "full schedule revealed",
};

export function DiffReviewStep({
  diff,
  timezone,
  dbStages,
  stageMismatchResolutions,
  orphanResolutions,
  onStageMismatchChange,
  onOrphanChange,
  onCommit,
  onReset,
  committing,
  commitError,
  canCommit,
  currentRevealLevel,
}: Props) {
  const showLiveWarning = currentRevealLevel !== "draft";
  return (
    <Card>
      <CardHeader>
        <CardTitle>Review Changes</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <DiffSummaryBanner diff={diff} />

        <StageMismatchResolver
          mismatches={diff.conflicts.stageNameMismatches}
          dbStages={dbStages}
          resolutions={stageMismatchResolutions}
          onChange={onStageMismatchChange}
        />

        <OrphanedSetsPanel
          orphanedSets={diff.conflicts.orphanedSets}
          timezone={timezone}
          resolutions={orphanResolutions}
          onChange={onOrphanChange}
        />

        {showLiveWarning && (
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>
              Schedule is {LEVEL_DESCRIPTION[currentRevealLevel]}.
            </AlertTitle>
            <AlertDescription>
              Committing will update what the public sees immediately:{" "}
              {diff.summary.setsToCreate} new ·{" "}
              {diff.cleanOperations.setsToUpdate.length} updated ·{" "}
              {
                Object.values(orphanResolutions).filter((r) => r === "archive")
                  .length
              }{" "}
              archived.
            </AlertDescription>
          </Alert>
        )}

        {commitError && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Import failed — no changes were saved.</AlertTitle>
            <AlertDescription>{commitError}</AlertDescription>
          </Alert>
        )}

        <div className="flex gap-3">
          <Button variant="outline" onClick={onReset} disabled={committing}>
            Start over
          </Button>
          <Button onClick={onCommit} disabled={!canCommit || committing}>
            {committing ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Committing…
              </>
            ) : commitError ? (
              "Retry"
            ) : (
              "Commit to database"
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
