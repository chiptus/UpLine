import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  type CommitResult,
  type DiffResult,
} from "@/services/scheduleImport/types";
import { CsvUploadStep } from "./CsvUploadStep";
import { ReviewStage } from "./ReviewStage";
import { CommitResultCard } from "./CommitResultCard";

type Props = { festivalEditionId: string };

type WizardState =
  | { step: "upload" }
  | { step: "review"; diff: DiffResult; timezone: string }
  | { step: "result"; result: CommitResult };

export function ScheduleImportWizard({ festivalEditionId }: Props) {
  const [state, setState] = useState<WizardState>({ step: "upload" });

  function reset() {
    setState({ step: "upload" });
  }

  if (state.step === "upload") {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Import Schedule</CardTitle>
        </CardHeader>
        <CardContent>
          <CsvUploadStep
            festivalEditionId={festivalEditionId}
            onDiffReady={(diff, timezone) =>
              setState({ step: "review", diff, timezone })
            }
          />
        </CardContent>
      </Card>
    );
  }

  if (state.step === "review") {
    return (
      <ReviewStage
        festivalEditionId={festivalEditionId}
        diff={state.diff}
        timezone={state.timezone}
        onCommitted={(result) => setState({ step: "result", result })}
        onReset={reset}
      />
    );
  }

  return <CommitResultCard result={state.result} onReset={reset} />;
}
