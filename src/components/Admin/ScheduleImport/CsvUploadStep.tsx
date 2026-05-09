import { useRef, useState } from "react";
import { Upload, Loader2 } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  parseScheduleCsv,
  callDiffSchedule,
  type CsvRow,
  type DiffResult,
} from "@/services/scheduleImportService";

const TIMEZONES = [
  { value: "Europe/Lisbon", label: "Lisbon (WET/WEST)" },
  { value: "Europe/London", label: "London (GMT/BST)" },
  { value: "Europe/Berlin", label: "Berlin (CET/CEST)" },
  { value: "America/New_York", label: "New York (EST/EDT)" },
  { value: "America/Los_Angeles", label: "Los Angeles (PST/PDT)" },
  { value: "UTC", label: "UTC" },
];

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
  const fileRef = useRef<HTMLInputElement>(null);
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

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
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
      <div className="space-y-2">
        <Label>Timezone</Label>
        <Select value={timezone} onValueChange={setTimezone}>
          <SelectTrigger className="w-64">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {TIMEZONES.map((tz) => (
              <SelectItem key={tz.value} value={tz.value}>
                {tz.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-sm text-muted-foreground">
          All times in the CSV are interpreted as local festival time.
        </p>
      </div>

      <div className="space-y-2">
        <Label>CSV File</Label>
        <div
          className="border-2 border-dashed border-muted-foreground/30 rounded-lg p-8 text-center cursor-pointer hover:border-muted-foreground/60 transition-colors"
          onClick={() => fileRef.current?.click()}
        >
          <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
          {fileName ? (
            <p className="text-sm font-medium">{fileName}</p>
          ) : (
            <p className="text-sm text-muted-foreground">Click to upload CSV</p>
          )}
          {rows.length > 0 && (
            <p className="text-xs text-muted-foreground mt-1">
              {rows.length} rows parsed
            </p>
          )}
        </div>
        <input
          ref={fileRef}
          type="file"
          accept=".csv"
          className="hidden"
          onChange={handleFileChange}
        />
        <p className="text-xs text-muted-foreground">
          Required column: <code>Artists</code> (use <code>|</code> for B2B,
          e.g. <code>Carl Cox | Peggy Gou</code>). Optional:{" "}
          <code>Set Name</code>, <code>Stage</code>, <code>Date</code>{" "}
          (YYYY-MM-DD), <code>Start Time</code> (HH:MM), <code>End Time</code>{" "}
          (HH:MM), <code>Description</code>.
        </p>
      </div>

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
