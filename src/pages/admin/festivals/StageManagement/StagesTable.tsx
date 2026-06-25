import type { Stage } from "@/api/stages/types";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Edit2, Trash2 } from "lucide-react";
import { DEFAULT_STAGE_COLOR } from "@/lib/constants/stages";

interface StagesTableProps {
  stages: Stage[];
  onEdit: (stage: Stage) => void;
  onDelete: (stage: Stage) => void;
}

export function StagesTable({ stages, onEdit, onDelete }: StagesTableProps) {
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Stage Name</TableHead>
            <TableHead>Order</TableHead>
            <TableHead>Color</TableHead>
            <TableHead>Created</TableHead>
            <TableHead className="w-20">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {stages.map((stage) => (
            <TableRow key={stage.id}>
              <TableCell className="font-medium">{stage.name}</TableCell>
              <TableCell>{stage.stage_order || 0}</TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <div
                    className="w-4 h-4 rounded border"
                    style={{
                      backgroundColor: stage.color || DEFAULT_STAGE_COLOR,
                    }}
                  />
                  {stage.color || DEFAULT_STAGE_COLOR}
                </div>
              </TableCell>
              <TableCell>
                {new Date(stage.created_at).toLocaleDateString()}
              </TableCell>
              <TableCell>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => onEdit(stage)}
                  >
                    <Edit2 className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => onDelete(stage)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {stages.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          No stages found for the selected edition.
        </div>
      )}
    </div>
  );
}
