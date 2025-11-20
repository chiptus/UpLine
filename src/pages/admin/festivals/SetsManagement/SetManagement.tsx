import { useState } from "react";
import { Link, useRouteContext } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Plus, Music, Upload } from "lucide-react";
import { FestivalSet } from "@/hooks/queries/sets/useSets";
import { useSetsQuery } from "@/hooks/queries/sets/useSets";
import { FestivalEdition } from "@/hooks/queries/festivals/editions/types";
import { useDeleteSetMutation } from "@/hooks/queries/sets/useDeleteSet";
import { SetFormDialog } from "../SetFormDialog";
import { SetsTable } from "../SetsTable";

interface SetManagementProps {}

export function SetManagement(_props: SetManagementProps) {
  // All hooks must be at the top level
  const { edition } = useRouteContext({ strict: false }) as { edition: FestivalEdition };
  const { data: sets = [], isLoading } = useSetsQuery();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingSet, setEditingSet] = useState<FestivalSet | null>(null);
  const deleteSetMutation = useDeleteSetMutation();

  function handleCreate() {
    setEditingSet(null);
    setIsDialogOpen(true);
  }

  function handleEdit(set: FestivalSet) {
    setEditingSet(set);
    setIsDialogOpen(true);
  }

  async function handleDelete(set: FestivalSet) {
    if (
      !confirm(
        `Are you sure you want to delete "${set.name}"? This will also delete all votes for this set.`,
      )
    ) {
      return;
    }

    deleteSetMutation.mutate(set.id);
  }

  function handleCloseDialog() {
    setIsDialogOpen(false);
    setEditingSet(null);
  }

  // Filter sets by selected edition
  const filteredSets = sets.filter(
    (set) => set.festival_edition_id === edition.id,
  );

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-8">
          <Loader2 className="h-6 w-6 animate-spin mr-2" />
          <span>Loading sets...</span>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Music className="h-5 w-5" />
            Set Management
          </span>
          <div className="flex gap-2">
            <Button variant="outline" asChild>
              <Link
                to={`/admin/festivals/${edition.festival_id}/${edition.id}/import?tab=sets`}
              >
                <Upload className="h-4 w-4 mr-2" />
                Import CSV
              </Link>
            </Button>
            <Button
              onClick={handleCreate}
              className="bg-purple-600 hover:bg-purple-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Set
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <SetsTable
          sets={filteredSets}
          onEdit={handleEdit}
          onDelete={handleDelete}
          editionId={edition.id}
        />
      </CardContent>

      <SetFormDialog
        isOpen={isDialogOpen}
        onClose={handleCloseDialog}
        editingSet={editingSet}
        editionId={edition.id}
      />
    </Card>
  );
}
