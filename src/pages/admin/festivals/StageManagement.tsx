import { useState } from "react";
import { Link, useOutletContext } from "react-router-dom";
import { useStagesByEditionQuery } from "@/hooks/queries/stages/useStagesByEdition";
import { FestivalEdition } from "@/hooks/queries/festivals/editions/types";
import { useDeleteStageMutation } from "@/hooks/queries/stages/useDeleteStage";
import { Stage } from "@/hooks/queries/stages/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, MapPin, Upload } from "lucide-react";
import { StagesTable } from "./StageManagement/StagesTable";
import { CreateStageDialog } from "./StageManagement/CreateStageDialog";
import { EditStageDialog } from "./StageManagement/EditStageDialog";

interface StageManagementProps {}

export function StageManagement(_props: StageManagementProps) {
  const { edition } = useOutletContext<{ edition: FestivalEdition }>();
  const { data: stages = [], isLoading } = useStagesByEditionQuery(edition.id);
  const deleteStageMutation = useDeleteStageMutation();

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

  // Filter stages by selected edition
  const filteredStages = stages.filter(
    (stage) => stage.festival_edition_id === edition.id,
  );

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-8">
          <Loader2 className="h-6 w-6 animate-spin mr-2" />
          <span>Loading stages...</span>
        </CardContent>
      </Card>
    );
  }

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
                to={`/admin/festivals/${edition.festival_id}/${edition.id}/import?tab=stages`}
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
