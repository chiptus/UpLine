import { useState } from "react";
import { createFileRoute, useParams } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { confirm } from "@/hooks/use-confirm";
import { Loader2, Plus, Music } from "lucide-react";
import { FestivalSet } from "@/api/sets/types";
import { useSetsByEditionQuery } from "@/api/sets/useSetsByEdition";
import { useDeleteSetMutation } from "@/api/sets/useDeleteSet";
import { useFestivalEditionBySlugQuery } from "@/api/editions/useFestivalEditionBySlug";
import { festivalBySlugQuery } from "@/api/festivals/useFestivalBySlug";
import { SetFormDialog } from "@/pages/admin/festivals/SetFormDialog/SetFormDialog";
import { SetsTable } from "@/pages/admin/festivals/SetsTable";
import { pageMeta } from "@/lib/pageHead";

export const Route = createFileRoute(
  "/admin/festivals/$festivalSlug/editions/$editionSlug/sets",
)({
  component: FestivalSets,
  head: ({ match }) => ({
    meta: pageMeta({
      title: "Sets",
      prefix: `Admin - ${match.context.festival?.name}`,
    }),
  }),
});

function FestivalSets() {
  const { festivalSlug, editionSlug } = useParams({
    from: "/admin/festivals/$festivalSlug/editions/$editionSlug/sets",
  });
  const { data: festival } = useSuspenseQuery(
    festivalBySlugQuery(festivalSlug),
  );
  const editionQuery = useFestivalEditionBySlugQuery({
    editionSlug,
    festivalId: festival.id,
  });
  const setsQuery = useSetsByEditionQuery(editionQuery.data?.id);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingSet, setEditingSet] = useState<FestivalSet | null>(null);
  const deleteSetMutation = useDeleteSetMutation();

  const isLoading = editionQuery.isLoading || setsQuery.isLoading;

  function handleCreate() {
    setEditingSet(null);
    setIsDialogOpen(true);
  }

  function handleEdit(set: FestivalSet) {
    setEditingSet(set);
    setIsDialogOpen(true);
  }

  async function handleDeleteRequest(set: FestivalSet) {
    const confirmed = await confirm({
      title: "Delete this set?",
      description: `Are you sure you want to delete "${set.name}"? This will also delete all votes for this set.`,
      confirmLabel: "Delete",
    });
    if (!confirmed) return;

    deleteSetMutation.mutate(set.id);
  }

  function handleCloseDialog() {
    setIsDialogOpen(false);
    setEditingSet(null);
  }

  if (isLoading || !editionQuery.data) {
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
            <Button
              onClick={handleCreate}
              className="bg-accent text-accent-foreground hover:bg-accent-hover"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Set
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <SetsTable
          sets={setsQuery.data || []}
          onEdit={handleEdit}
          onDelete={handleDeleteRequest}
          editionId={editionQuery.data.id}
          timezone={festival.timezone}
        />
      </CardContent>

      <SetFormDialog
        isOpen={isDialogOpen}
        onClose={handleCloseDialog}
        editingSet={editingSet}
        editionId={editionQuery.data.id}
        timezone={festival.timezone}
      />
    </Card>
  );
}
