import { useState } from "react";
import { Loader2 } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import {
  parseScheduleCsv,
  callDiffSchedule,
  type CsvRow,
  type DiffResult,
} from "@/services/scheduleImportService";
import { TimezonePicker } from "./TimezonePicker";
import { CsvDropZone } from "./CsvDropZone";

type Props = {
  festivalEditionId: string;
  onDiffReady: (diff: DiffResult) => void;
};

async function readFile(file: File): Promise<CsvRow[]> {
  const content = await file.text();
  const parsed = parseScheduleCsv(content);
  if (parsed.length === 0) {
    throw new Error(
      "No valid rows found. Make sure your CSV has an 'Artists' column.",
    );
  }
  return parsed;
}

export function CsvUploadStep({ festivalEditionId, onDiffReady }: Props) {
  const [timezone, setTimezone] = useState("Europe/Lisbon");
  const [fileName, setFileName] = useState<string | null>(null);

  const readFileMutation = useMutation({ mutationFn: readFile });
  const analyseMutation = useMutation({
    mutationFn: (rows: CsvRow[]) =>
      callDiffSchedule(festivalEditionId, timezone, rows),
    onSuccess: onDiffReady,
  });

  const rows = readFileMutation.data ?? [];
  const error =
    analyseMutation.error?.message ?? readFileMutation.error?.message ?? null;

  function handleFileSelected(file: File) {
    setFileName(file.name);
    analyseMutation.reset();
    readFileMutation.mutate(file);
  }

  function handleAnalyse() {
    if (rows.length === 0) return;
    analyseMutation.mutate(rows);
  }

  return (
    <div className="space-y-6">
      <TimezonePicker value={timezone} onChange={setTimezone} />
      <CsvDropZone
        fileName={fileName}
        rowCount={rows.length}
        onFileSelected={handleFileSelected}
      />

      {error && <p className="text-sm text-destructive">{error}</p>}

      <Button
        onClick={handleAnalyse}
        disabled={rows.length === 0 || analyseMutation.isPending}
        className="w-full"
      >
        {analyseMutation.isPending ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Analysing…
          </>
        ) : (
          "Analyse Schedule"
        )}
      </Button>
    </div>
  );
}
