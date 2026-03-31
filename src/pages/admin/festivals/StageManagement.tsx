import { useState } from "react";
import { Link, useParams } from "@tanstack/react-router";
import { useStagesByEditionQuery } from "@/hooks/queries/stages/useStagesByEdition";
import { useDeleteStageMutation } from "@/hooks/queries/stages/useDeleteStage";
import { Stage } from "@/hooks/queries/stages/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, MapPin, Upload } from "lucide-react";
import { StagesTable } from "./StageManagement/StagesTable";
import { CreateStageDialog } from "./StageManagement/CreateStageDialog";
import { EditStageDialog } from "./StageManagement/EditStageDialog";
import { useFestivalEditionBySlugQuery } from "@/hooks/queries/festivals/editions/useFestivalEditionBySlug";

interface StageManagementProps {}

export function StageManagement(_props: StageManagementProps) {
  const { festivalSlug, editionSlug } = useParams({
    from: "/admin/festivals/$festivalSlug/editions/$editionSlug/stages",
  });
  const { data: edition, isLoading: editionLoading } =
    useFestivalEditionBySlugQuery({ festivalSlug, editionSlug });
  const { data: stages = [], isLoading: stagesLoading } =
    useStagesByEditionQuery(edition?.id ?? "");
  const deleteStageMutation = useDeleteStageMutation();

  const isLoading = editionLoading || stagesLoading;

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

  if (isLoading || !edition) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-8">
          <Loader2 className="h-6 w-6 animate-spin mr-2" />
          <span>Loading stages...</span>
        </CardContent>
      </Card>
    );
  }

  const filteredStages = stages.filter(
    (stage) => stage.festival_edition_id === edition.id,
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Stage Management
          </span>
          <div className="flex gap-2">
            <Button variant="outline" asChild>
              <Link
                to="/admin/festivals/$festivalId/$editionId/import"
                params={{
                  festivalId: edition.festival_id,
                  editionId: edition.id,
                }}
                search={{ tab: "stages" }}
              >
                <Upload className="h-4 w-4 mr-2" />
                Import CSV
              </Link>
            </Button>
            <CreateStageDialog editionId={edition.id} />
          </div>
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
