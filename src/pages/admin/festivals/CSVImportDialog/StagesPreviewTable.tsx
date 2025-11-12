import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { StageImportData } from "@/services/csv/csvParser";

interface StagesPreviewTableProps {
  stages: StageImportData[];
}

export function StagesPreviewTable({ stages }: StagesPreviewTableProps) {
  if (stages.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">
          Preview: {stages.length} stage{stages.length !== 1 ? "s" : ""}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">#</TableHead>
                <TableHead>Stage Name</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {stages.map((stage, index) => (
                <TableRow key={index}>
                  <TableCell className="font-mono text-sm text-muted-foreground">
                    {index + 1}
                  </TableCell>
                  <TableCell>{stage.name}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
