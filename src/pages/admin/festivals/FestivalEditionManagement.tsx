import { useState } from "react";
import { useFestivalEditionsForFestivalQuery } from "@/api/editions/useFestivalEditionsForFestival";
import { useFestivalBySlugQuery } from "@/api/festivals/useFestivalBySlug";
import { useDeleteFestivalEditionMutation } from "@/api/editions/useDeleteFestivalEdition";
import { FestivalEdition } from "@/api/editions/types";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { confirm } from "@/hooks/use-confirm";
import { Loader2, Plus, Edit2, Trash2, CalendarDays } from "lucide-react";
import { cn } from "@/lib/utils";
import { EditionDialog } from "./EditionDialog";

export function FestivalEditionManagement({
  festivalSlug,
  onSelect,
  selected,
}: {
  festivalSlug: string;
  onSelect: (editionSlug: string) => void;
  selected: string;
}) {
  // All hooks must be at the top level
  const festivalQuery = useFestivalBySlugQuery(festivalSlug);
  const { data: editions = [], isLoading } =
    useFestivalEditionsForFestivalQuery(festivalQuery.data?.id, { all: true });
  const deleteEditionMutation = useDeleteFestivalEditionMutation();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingEdition, setEditingEdition] = useState<FestivalEdition | null>(
    null,
  );

  if (festivalQuery.isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-8">
          <Loader2 className="h-6 w-6 animate-spin mr-2" />
          <span>Loading festival...</span>
        </CardContent>
      </Card>
    );
  }

  if (!festivalQuery.data) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-8">
          <span>Festival not found</span>
        </CardContent>
      </Card>
    );
  }

  function handleCreate() {
    setEditingEdition(null);
    setIsDialogOpen(true);
  }

  function handleEdit(edition: FestivalEdition) {
    setEditingEdition(edition);
    setIsDialogOpen(true);
  }

  async function handleDeleteRequest(edition: FestivalEdition) {
    const confirmed = await confirm({
      title: "Delete this edition?",
      description: `Are you sure you want to delete "${edition.name}"? This will also delete all associated stages and sets.`,
      confirmLabel: "Delete",
    });
    if (!confirmed) return;

    deleteEditionMutation.mutate(edition.id);
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-8">
          <Loader2 className="h-6 w-6 animate-spin mr-2" />
          <span>Loading festival editions...</span>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <CalendarDays className="h-5 w-5" />
            Editions
          </span>
          <Button
            onClick={handleCreate}
            className="bg-accent text-accent-foreground hover:bg-accent-hover"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Edition
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Edition Name</TableHead>
                <TableHead>Year</TableHead>
                <TableHead>Start Date</TableHead>
                <TableHead>End Date</TableHead>
                <TableHead className="w-20">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {editions.map((edition) => (
                <TableRow
                  key={edition.id}
                  onClick={() => onSelect(edition.slug)}
                  className={cn(
                    selected === edition.slug ? "bg-slate-200 selected" : "",
                  )}
                >
                  <TableCell>{edition.name}</TableCell>
                  <TableCell>{edition.year}</TableCell>
                  <TableCell>{edition.start_date || "—"}</TableCell>
                  <TableCell>{edition.end_date || "—"}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleEdit(edition);
                        }}
                        aria-label={`Edit ${edition.name}`}
                        title={`Edit ${edition.name}`}
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleDeleteRequest(edition);
                        }}
                        className="text-destructive hover:text-destructive"
                        aria-label={`Delete ${edition.name}`}
                        title={`Delete ${edition.name}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {editions.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              No festival editions found. Create your first edition to get
              started.
            </div>
          )}
        </div>
      </CardContent>
      <EditionDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        festivalId={festivalQuery.data.id}
        editingEdition={editingEdition}
      />
    </Card>
  );
}
