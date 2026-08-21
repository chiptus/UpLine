import { useState } from "react";
import { createFileRoute, useParams } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useStagesByEditionQuery } from "@/api/stages/useStagesByEdition";
import { useDeleteStageMutation } from "@/api/stages/useDeleteStage";
import type { Stage } from "@/api/stages/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { confirm } from "@/hooks/use-confirm";
import { Loader2, MapPin } from "lucide-react";
import { StagesTable } from "@/pages/admin/festivals/StageManagement/StagesTable";
import { CreateStageDialog } from "@/pages/admin/festivals/StageManagement/CreateStageDialog";
import { EditStageDialog } from "@/pages/admin/festivals/StageManagement/EditStageDialog";
import { useFestivalEditionBySlugQuery } from "@/api/editions/useFestivalEditionBySlug";
import { festivalBySlugQuery } from "@/api/festivals/useFestivalBySlug";
import { pageMeta } from "@/lib/pageHead";

export const Route = createFileRoute(
  "/admin/festivals/$festivalSlug/editions/$editionSlug/stages",
)({
  component: FestivalStages,
  head: ({ match }) => ({
    meta: pageMeta({
      title: "Stages",
      prefix: `Admin - ${match.context.festival?.name}`,
    }),
  }),
});

function FestivalStages() {
  const { festivalSlug, editionSlug } = useParams({
    from: "/admin/festivals/$festivalSlug/editions/$editionSlug/stages",
  });
  const { data: festival } = useSuspenseQuery(
    festivalBySlugQuery(festivalSlug),
  );
  const editionQuery = useFestivalEditionBySlugQuery({
    editionSlug,
    festivalId: festival.id,
  });
  const stagesQuery = useStagesByEditionQuery(editionQuery.data?.id ?? "");
  const deleteStageMutation = useDeleteStageMutation();

  const isLoading = editionQuery.isLoading || stagesQuery.isLoading;

  const [editingStage, setEditingStage] = useState<Stage | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  function handleEdit(stage: Stage) {
    setEditingStage(stage);
    setIsEditDialogOpen(true);
  }

  function handleCloseEditDialog() {
    setIsEditDialogOpen(false);
    setEditingStage(null);
  }

  async function handleDeleteRequest(stage: Stage) {
    const confirmed = await confirm({
      title: "Delete this stage?",
      description: `Are you sure you want to delete "${stage.name}"? This will also affect all sets assigned to this stage.`,
      confirmLabel: "Delete",
    });
    if (!confirmed) return;

    deleteStageMutation.mutate(stage.id);
  }

  if (isLoading || !editionQuery.data) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-8">
          <Loader2 className="h-6 w-6 animate-spin mr-2" />
          <span>Loading stages...</span>
        </CardContent>
      </Card>
    );
  }

  const filteredStages = (stagesQuery.data || []).filter(
    (stage) => stage.festival_edition_id === editionQuery.data.id,
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Stage Management
          </span>
          <CreateStageDialog editionId={editionQuery.data.id} />
        </CardTitle>
      </CardHeader>
      <CardContent>
        <StagesTable
          stages={filteredStages}
          onEdit={handleEdit}
          onDelete={handleDeleteRequest}
        />

        <EditStageDialog
          stage={editingStage}
          isOpen={isEditDialogOpen}
          onClose={handleCloseEditDialog}
        />
      </CardContent>
    </Card>
  );
}
