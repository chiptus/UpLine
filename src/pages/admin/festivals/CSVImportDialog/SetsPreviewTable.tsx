import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, CheckCircle2 } from "lucide-react";
import type { SetImportData } from "@/services/csv/csvParser";
import {
  validateSetData,
  type SetValidationResult,
} from "@/services/csv/timeValidator";
import { cn } from "@/lib/utils";

interface SetsPreviewTableProps {
  sets: SetImportData[];
  timezone: string;
}

export function SetsPreviewTable({ sets, timezone }: SetsPreviewTableProps) {
  if (sets.length === 0) {
    return null;
  }

  const validationResults: SetValidationResult[] = sets.map((set, index) =>
    validateSetData(set, index, timezone),
  );

  const validCount = validationResults.filter((r) => r.isValid).length;
  const invalidCount = validationResults.length - validCount;

  const hasSeparateDateFields = sets.some(
    (set) => set.date_start !== undefined || set.date_end !== undefined,
  );

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">
            Preview: {sets.length} set{sets.length !== 1 ? "s" : ""} (timezone:{" "}
            {timezone})
          </CardTitle>
          <div className="flex gap-2">
            {validCount > 0 && (
              <Badge variant="outline" className="gap-1">
                <CheckCircle2 className="h-3 w-3 text-green-600" />
                {validCount} valid
              </Badge>
            )}
            {invalidCount > 0 && (
              <Badge variant="destructive" className="gap-1">
                <AlertCircle className="h-3 w-3" />
                {invalidCount} invalid
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">#</TableHead>
                <TableHead>Stage</TableHead>
                <TableHead>Artist(s)</TableHead>
                {hasSeparateDateFields ? (
                  <>
                    <TableHead>Date Start</TableHead>
                    <TableHead>Time Start</TableHead>
                    <TableHead>Date End</TableHead>
                    <TableHead>Time End</TableHead>
                  </>
                ) : (
                  <>
                    <TableHead>Start Time</TableHead>
                    <TableHead>End Time</TableHead>
                  </>
                )}
                <TableHead>Set Name</TableHead>
                <TableHead>Description</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sets.map((set, index) => {
                const validation = validationResults[index];
                const hasErrors = !validation.isValid;

                return (
                  <TableRow
                    key={index}
                    className={cn(hasErrors && "bg-destructive/5")}
                  >
                    <TableCell className="font-mono text-sm text-muted-foreground">
                      {index + 1}
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div>{set.stage_name || "-"}</div>
                        {validation.errors.stage_name && (
                          <div className="text-xs text-destructive">
                            {validation.errors.stage_name}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div>{set.artist_names}</div>
                        {validation.errors.artist_names && (
                          <div className="text-xs text-destructive">
                            {validation.errors.artist_names}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    {hasSeparateDateFields ? (
                      <>
                        <TableCell className="font-mono text-sm">
                          <div>{set.date_start || "-"}</div>
                        </TableCell>
                        <TableCell className="font-mono text-sm">
                          <div className="space-y-1">
                            <div>{set.time_start || "-"}</div>
                            {validation.errors.time_start && (
                              <div className="text-xs text-destructive">
                                {validation.errors.time_start}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="font-mono text-sm">
                          <div>{set.date_end || "-"}</div>
                        </TableCell>
                        <TableCell className="font-mono text-sm">
                          <div className="space-y-1">
                            <div>{set.time_end || "-"}</div>
                            {validation.errors.time_end && (
                              <div className="text-xs text-destructive">
                                {validation.errors.time_end}
                              </div>
                            )}
                          </div>
                        </TableCell>
                      </>
                    ) : (
                      <>
                        <TableCell className="font-mono text-sm">
                          <div className="space-y-1">
                            <div>{set.time_start || "-"}</div>
                            {validation.errors.time_start && (
                              <div className="text-xs text-destructive">
                                {validation.errors.time_start}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="font-mono text-sm">
                          <div className="space-y-1">
                            <div>{set.time_end || "-"}</div>
                            {validation.errors.time_end && (
                              <div className="text-xs text-destructive">
                                {validation.errors.time_end}
                              </div>
                            )}
                          </div>
                        </TableCell>
                      </>
                    )}
                    <TableCell>{set.name || "-"}</TableCell>
                    <TableCell className="max-w-xs truncate">
                      {set.description || "-"}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
