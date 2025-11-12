import { TableCell } from "@/components/ui/table";

interface StageCellWithValidationProps {
  stageName?: string;
  error?: string;
}

export function StageCellWithValidation({
  stageName,
  error,
}: StageCellWithValidationProps) {
  return (
    <TableCell>
      <div className="space-y-1">
        <div>{stageName || "-"}</div>
        {error && <div className="text-xs text-destructive">{error}</div>}
      </div>
    </TableCell>
  );
}
