import { useState } from "react";
import { CheckCircle2, Loader2, RotateCcw, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQueryClient } from "@tanstack/react-query";
import {
  type CsvRow,
  type DiffResult,
  type StageMismatchResolution,
  type OrphanResolution,
  type CommitResult,
  buildCommitPayload,
  callCommitSchedule,
} from "@/services/scheduleImportService";
import { CsvUploadStep } from "./CsvUploadStep";
import { DiffSummaryBanner } from "./DiffSummaryBanner";
import { StageMismatchResolver } from "./StageMismatchResolver";
import { OrphanedSetsPanel } from "./OrphanedSetsPanel";
import { useStagesByEditionQuery } from "@/hooks/queries/stages/useStagesByEdition";

type Step = "upload" | "review" | "result";

type Props = { festivalEditionId: string };

export function ScheduleImportWizard({ festivalEditionId }: Props) {
  const queryClient = useQueryClient();
  const stagesQuery = useStagesByEditionQuery(festivalEditionId);

  const [step, setStep] = useState<Step>("upload");
  const [diff, setDiff] = useState<DiffResult | null>(null);
  const [rows, setRows] = useState<CsvRow[]>([]);
  const [timezone, setTimezone] = useState("Europe/Lisbon");
  const [stageMismatchResolutions, setStageMismatchResolutions] = useState<
    Record<string, StageMismatchResolution>
  >({});
  const [orphanResolutions, setOrphanResolutions] = useState<
    Record<string, OrphanResolution>
  >({});
  const [committing, setCommitting] = useState(false);
  const [commitResult, setCommitResult] = useState<CommitResult | null>(null);
  const [commitError, setCommitError] = useState<string | null>(null);

  function handleDiffReady(newDiff: DiffResult, newRows: CsvRow[], newTimezone: string) {
    setDiff(newDiff);
    setRows(newRows);
    setTimezone(newTimezone);
    setStageMismatchResolutions(
      Object.fromEntries(
        newDiff.conflicts.stageNameMismatches.map((m) => [
          m.csvValue,
          { action: "map" as const, dbStageName: m.closestDbValue },
        ]),
      ),
    );
    setOrphanResolutions({});
    setCommitResult(null);
    setCommitError(null);
    setStep("review");
  }

  function handleStageMismatchChange(csvValue: string, resolution: StageMismatchResolution) {
    setStageMismatchResolutions((prev) => ({ ...prev, [csvValue]: resolution }));
  }

  function handleOrphanChange(setId: string, resolution: OrphanResolution) {
    setOrphanResolutions((prev) => ({ ...prev, [setId]: resolution }));
  }

  function canCommit() {
    if (!diff) return false;
    return diff.conflicts.stageNameMismatches.every(
      (m) => stageMismatchResolutions[m.csvValue] != null,
    );
  }

  async function handleCommit() {
    if (!diff) return;
    setCommitting(true);
    setCommitError(null);
    try {
      const payload = buildCommitPayload(diff, stageMismatchResolutions, orphanResolutions);
      const result = await callCommitSchedule(festivalEditionId, payload);
      setCommitResult(result);
      setStep("result");
      queryClient.invalidateQueries({ queryKey: ["sets", festivalEditionId] });
      queryClient.invalidateQueries({ queryKey: ["stages", festivalEditionId] });
      queryClient.invalidateQueries({ queryKey: ["artists"] });
    } catch (err) {
      setCommitError(err instanceof Error ? err.message : "Commit failed.");
    } finally {
      setCommitting(false);
    }
  }

  function handleReset() {
    setStep("upload");
    setDiff(null);
    setRows([]);
    setStageMismatchResolutions({});
    setOrphanResolutions({});
    setCommitResult(null);
    setCommitError(null);
  }

  if (step === "upload") {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Import Schedule</CardTitle>
        </CardHeader>
        <CardContent>
          <CsvUploadStep
            festivalEditionId={festivalEditionId}
            onDiffReady={handleDiffReady}
          />
        </CardContent>
      </Card>
    );
  }

  if (step === "result" && commitResult) {
    return (
      <Card>
        <CardContent className="pt-6 space-y-4">
          <div className="flex items-center gap-3 text-green-600">
            <CheckCircle2 className="h-6 w-6" />
            <span className="font-medium">Schedule imported successfully</span>
          </div>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>{commitResult.setsCreated} set{commitResult.setsCreated !== 1 ? "s" : ""} created</li>
            <li>{commitResult.setsUpdated} set{commitResult.setsUpdated !== 1 ? "s" : ""} updated</li>
            {commitResult.setsArchived > 0 && (
              <li>{commitResult.setsArchived} set{commitResult.setsArchived !== 1 ? "s" : ""} archived</li>
            )}
          </ul>
          <Button variant="outline" onClick={handleReset}>
            <RotateCcw className="h-4 w-4 mr-2" />
            Import another file
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!diff) return null;

  const dbStages = stagesQuery.data ?? [];

  return (
    <div className="space-y-6">
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
            onChange={handleStageMismatchChange}
          />

          <OrphanedSetsPanel
            orphanedSets={diff.conflicts.orphanedSets}
            resolutions={orphanResolutions}
            onChange={handleOrphanChange}
          />

          {commitError && (
            <div className="flex items-start gap-2 rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
              <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
              <div>
                <p className="font-medium">Import failed — no changes were saved.</p>
                <p className="mt-0.5">{commitError}</p>
              </div>
            </div>
          )}

          <div className="flex gap-3">
            <Button variant="outline" onClick={handleReset} disabled={committing}>
              Start over
            </Button>
            <Button onClick={handleCommit} disabled={!canCommit() || committing}>
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
    </div>
  );
}
