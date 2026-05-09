import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  type DiffResult,
  type StageMismatchResolution,
  type OrphanResolution,
  buildCommitPayload,
  callCommitSchedule,
} from "@/services/scheduleImportService";
import { useStagesByEditionQuery } from "@/hooks/queries/stages/useStagesByEdition";
import { setsKeys } from "@/hooks/queries/sets/useSets";
import { stagesKeys } from "@/hooks/queries/stages/types";
import { artistsKeys } from "@/hooks/queries/artists/useArtists";
import { CsvUploadStep } from "./CsvUploadStep";
import { DiffReviewStep } from "./DiffReviewStep";
import { CommitResultCard } from "./CommitResultCard";

type Step = "upload" | "review" | "result";

type Props = { festivalEditionId: string };

export function ScheduleImportWizard({ festivalEditionId }: Props) {
  const queryClient = useQueryClient();
  const stagesQuery = useStagesByEditionQuery(festivalEditionId);

  const [step, setStep] = useState<Step>("upload");
  const [diff, setDiff] = useState<DiffResult | null>(null);
  const [stageMismatchResolutions, setStageMismatchResolutions] = useState<
    Record<string, StageMismatchResolution>
  >({});
  const [orphanResolutions, setOrphanResolutions] = useState<
    Record<string, OrphanResolution>
  >({});

  const commitMutation = useMutation({
    mutationFn: (currentDiff: DiffResult) => {
      const payload = buildCommitPayload(
        currentDiff,
        stageMismatchResolutions,
        orphanResolutions,
      );
      return callCommitSchedule(festivalEditionId, payload);
    },
    onSuccess: () => {
      setStep("result");
      queryClient.invalidateQueries({ queryKey: setsKeys.all });
      queryClient.invalidateQueries({
        queryKey: stagesKeys.byEdition(festivalEditionId),
      });
      queryClient.invalidateQueries({ queryKey: artistsKeys.all });
    },
  });

  function handleDiffReady(newDiff: DiffResult) {
    setDiff(newDiff);
    setStageMismatchResolutions(
      Object.fromEntries(
        newDiff.conflicts.stageNameMismatches.map((m) => [
          m.csvValue,
          { action: "map" as const, dbStageName: m.closestDbValue },
        ]),
      ),
    );
    setOrphanResolutions({});
    commitMutation.reset();
    setStep("review");
  }

  function handleReset() {
    setStep("upload");
    setDiff(null);
    setStageMismatchResolutions({});
    setOrphanResolutions({});
    commitMutation.reset();
  }

  function handleCommit() {
    if (!diff) return;
    commitMutation.mutate(diff);
  }

  function canCommit() {
    if (!diff) return false;
    return diff.conflicts.stageNameMismatches.every(
      (m) => stageMismatchResolutions[m.csvValue] != null,
    );
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

  if (step === "result" && commitMutation.data) {
    return (
      <CommitResultCard result={commitMutation.data} onReset={handleReset} />
    );
  }

  if (!diff) return null;

  return (
    <DiffReviewStep
      diff={diff}
      dbStages={stagesQuery.data ?? []}
      stageMismatchResolutions={stageMismatchResolutions}
      orphanResolutions={orphanResolutions}
      onStageMismatchChange={(csvValue, resolution) =>
        setStageMismatchResolutions((prev) => ({
          ...prev,
          [csvValue]: resolution,
        }))
      }
      onOrphanChange={(setId, resolution) =>
        setOrphanResolutions((prev) => ({ ...prev, [setId]: resolution }))
      }
      onCommit={handleCommit}
      onReset={handleReset}
      committing={commitMutation.isPending}
      commitError={commitMutation.error?.message ?? null}
      canCommit={canCommit()}
    />
  );
}
