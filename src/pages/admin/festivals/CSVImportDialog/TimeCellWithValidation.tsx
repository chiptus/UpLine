import { TableCell } from "@/components/ui/table";

interface TimeCellWithValidationProps {
  time?: string;
  error?: string;
}

export function TimeCellWithValidation({
  time,
  error,
}: TimeCellWithValidationProps) {
  return (
    <TableCell className="font-mono text-sm">
      <div className="space-y-1">
        <div>{time || "-"}</div>
        {error && <div className="text-xs text-destructive">{error}</div>}
      </div>
    </TableCell>
  );
}
