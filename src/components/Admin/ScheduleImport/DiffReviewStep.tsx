import { AlertCircle, Loader2 } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  type DiffResult,
  type StageMismatchResolution,
  type OrphanResolution,
  isEditionChangedError,
} from "@/services/scheduleImport/types";
import type { RevealLevel } from "@/lib/scheduleReveal";
import { DiffSummaryBanner } from "./DiffSummaryBanner";
import { TypedSetsPanel } from "./TypedSetsPanel";
import { StageMismatchResolver } from "./StageMismatchResolver";
import { OrphanedSetsPanel } from "./OrphanedSetsPanel";
import { LiveCommitWarning } from "./LiveCommitWarning";

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
  const setsToArchive = Object.values(orphanResolutions).filter(
    (r) => r === "archive",
  ).length;
  const editionChanged =
    commitError != null && isEditionChangedError(commitError);
  return (
    <Card>
      <CardHeader>
        <CardTitle>Review Changes</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <DiffSummaryBanner diff={diff} />

        <TypedSetsPanel
          setsToCreate={diff.cleanOperations.setsToCreate}
          setsToUpdate={diff.cleanOperations.setsToUpdate}
        />

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

        <LiveCommitWarning
          level={currentRevealLevel}
          setsToCreate={diff.summary.setsToCreate}
          setsToUpdate={diff.cleanOperations.setsToUpdate.length}
          setsToArchive={setsToArchive}
        />

        {commitError && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>
              {editionChanged
                ? "The schedule changed since this review"
                : "Import failed — no changes were saved."}
            </AlertTitle>
            <AlertDescription>
              {editionChanged
                ? "Someone changed this edition's schedule after Analyse ran. Nothing was applied — click Start over to re-run Analyse against the latest data."
                : commitError}
            </AlertDescription>
          </Alert>
        )}

        <div className="flex gap-3">
          <Button variant="outline" onClick={onReset} disabled={committing}>
            Start over
          </Button>
          <Button
            onClick={onCommit}
            disabled={!canCommit || committing || editionChanged}
          >
            {committing ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Committing…
              </>
            ) : commitError && !editionChanged ? (
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
