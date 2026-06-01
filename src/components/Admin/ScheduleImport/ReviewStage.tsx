import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { buildCommitPayload } from "@/services/scheduleImport/buildCommitPayload";
import { callCommitSchedule } from "@/services/scheduleImport/api";
import {
  type CommitResult,
  type DiffResult,
  type OrphanResolution,
  type StageMismatchResolution,
} from "@/services/scheduleImport/types";
import { artistsKeys } from "@/hooks/queries/artists/useArtists";
import { setsKeys } from "@/hooks/queries/sets/useSets";
import { stagesKeys } from "@/hooks/queries/stages/types";
import { useStagesByEditionQuery } from "@/hooks/queries/stages/useStagesByEdition";
import type { RevealLevel } from "@/lib/scheduleReveal";
import { DiffReviewStep } from "./DiffReviewStep";

type Props = {
  festivalEditionId: string;
  diff: DiffResult;
  timezone: string;
  currentRevealLevel: RevealLevel;
  onCommitted: (result: CommitResult) => void;
  onReset: () => void;
};

export function ReviewStage({
  festivalEditionId,
  diff,
  timezone,
  currentRevealLevel,
  onCommitted,
  onReset,
}: Props) {
  const queryClient = useQueryClient();
  const stagesQuery = useStagesByEditionQuery(festivalEditionId);

  const [stageMismatchResolutions, setStageMismatchResolutions] = useState<
    Record<string, StageMismatchResolution>
  >(() =>
    Object.fromEntries(
      diff.conflicts.stageNameMismatches.map((m) => [
        m.csvValue,
        { action: "map" as const, dbStageName: m.closestDbValue },
      ]),
    ),
  );
  const [orphanResolutions, setOrphanResolutions] = useState<
    Record<string, OrphanResolution>
  >({});

  const commitMutation = useMutation({
    mutationFn: () => {
      const payload = buildCommitPayload(
        diff,
        stageMismatchResolutions,
        orphanResolutions,
      );
      return callCommitSchedule(festivalEditionId, payload);
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: setsKeys.all });
      queryClient.invalidateQueries({
        queryKey: stagesKeys.byEdition(festivalEditionId),
      });
      queryClient.invalidateQueries({ queryKey: artistsKeys.all });
      onCommitted(result);
    },
  });

  const canCommit = diff.conflicts.stageNameMismatches.every(
    (m) => stageMismatchResolutions[m.csvValue] != null,
  );

  return (
    <DiffReviewStep
      diff={diff}
      timezone={timezone}
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
      onCommit={() => commitMutation.mutate()}
      onReset={onReset}
      committing={commitMutation.isPending}
      commitError={commitMutation.error?.message ?? null}
      canCommit={canCommit}
      currentRevealLevel={currentRevealLevel}
    />
  );
}
