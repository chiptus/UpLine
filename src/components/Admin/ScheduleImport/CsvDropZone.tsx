import { useId, useRef } from "react";
import { Upload } from "lucide-react";
import { Label } from "@/components/ui/label";

type Props = {
  fileName: string | null;
  rowCount: number;
  onFileSelected: (file: File) => void;
};

export function CsvDropZone({ fileName, rowCount, onFileSelected }: Props) {
  const fileRef = useRef<HTMLInputElement>(null);
  const inputId = useId();

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) onFileSelected(file);
    // Clear the value so re-selecting the same file still fires onChange.
    e.target.value = "";
  }

  return (
    <div className="space-y-2">
      <Label htmlFor={inputId}>CSV File</Label>
      <button
        type="button"
        onClick={() => fileRef.current?.click()}
        className="w-full border-2 border-dashed border-muted-foreground/30 rounded-lg p-8 text-center cursor-pointer hover:border-muted-foreground/60 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
      >
        <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
        {fileName ? (
          <p className="text-sm font-medium">{fileName}</p>
        ) : (
          <p className="text-sm text-muted-foreground">Click to upload CSV</p>
        )}
        {rowCount > 0 && (
          <p className="text-xs text-muted-foreground mt-1">
            {rowCount} rows parsed
          </p>
        )}
      </button>
      <input
        ref={fileRef}
        id={inputId}
        type="file"
        accept=".csv"
        className="hidden"
        onChange={handleChange}
      />
      <p className="text-xs text-muted-foreground">
        Required column: <code>Artists</code> (use <code>|</code> for B2B, e.g.{" "}
        <code>Carl Cox | Peggy Gou</code>). Optional: <code>Set Name</code>,{" "}
        <code>Type</code> (music, workshop, performance or other),{" "}
        <code>Stage</code>, <code>Date</code> (YYYY-MM-DD),{" "}
        <code>Start Time</code> (HH:MM), <code>End Time</code> (HH:MM),{" "}
        <code>Description</code>. Rows without artists are kept when they have a{" "}
        <code>Set Name</code> (e.g. workshops). The CSV is treated as the
        complete schedule: existing sets missing from it are flagged for
        archiving in the review step.
      </p>
    </div>
  );
}
