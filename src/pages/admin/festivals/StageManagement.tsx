import { useState } from "react";
import { useParams } from "@tanstack/react-router";
import { useStagesByEditionQuery } from "@/api/stages/useStagesByEdition";
import { useDeleteStageMutation } from "@/api/stages/useDeleteStage";
import type { Stage } from "@/api/stages/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, MapPin } from "lucide-react";
import { StagesTable } from "./StageManagement/StagesTable";
import { CreateStageDialog } from "./StageManagement/CreateStageDialog";
import { EditStageDialog } from "./StageManagement/EditStageDialog";
import { useFestivalEditionBySlugQuery } from "@/api/editions/useFestivalEditionBySlug";

interface StageManagementProps {}

export function StageManagement(_props: StageManagementProps) {
  const { festivalSlug, editionSlug } = useParams({
    from: "/admin/festivals/$festivalSlug/editions/$editionSlug/stages",
  });
  const editionQuery = useFestivalEditionBySlugQuery({
    festivalSlug,
    editionSlug,
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

  async function handleDelete(stage: Stage) {
    if (
      !confirm(
        `Are you sure you want to delete "${stage.name}"? This will also affect all sets assigned to this stage.`,
      )
    ) {
      return;
    }

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
          onDelete={handleDelete}
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
