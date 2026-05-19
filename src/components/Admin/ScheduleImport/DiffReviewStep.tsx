import { AlertCircle, Loader2 } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  type DiffResult,
  type StageMismatchResolution,
  type OrphanResolution,
} from "@/services/scheduleImportService";
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
}: Props) {
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
