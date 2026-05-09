import { useRef } from "react";
import { Upload } from "lucide-react";
import { Label } from "@/components/ui/label";

type Props = {
  fileName: string | null;
  rowCount: number;
  onFileSelected: (file: File) => void;
};

export function CsvDropZone({ fileName, rowCount, onFileSelected }: Props) {
  const fileRef = useRef<HTMLInputElement>(null);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) onFileSelected(file);
  }

  return (
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
        {rowCount > 0 && (
          <p className="text-xs text-muted-foreground mt-1">
            {rowCount} rows parsed
          </p>
        )}
      </div>
      <input
        ref={fileRef}
        type="file"
        accept=".csv"
        className="hidden"
        onChange={handleChange}
      />
      <p className="text-xs text-muted-foreground">
        Required column: <code>Artists</code> (use <code>|</code> for B2B, e.g.{" "}
        <code>Carl Cox | Peggy Gou</code>). Optional: <code>Set Name</code>,{" "}
        <code>Stage</code>, <code>Date</code> (YYYY-MM-DD),{" "}
        <code>Start Time</code> (HH:MM), <code>End Time</code> (HH:MM),{" "}
        <code>Description</code>.
      </p>
    </div>
  );
}
