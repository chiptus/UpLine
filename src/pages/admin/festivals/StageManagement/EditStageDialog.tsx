import { useUpdateStageMutation } from "@/api/stages/useUpdateStage";
import type { Stage } from "@/api/stages/types";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { StageForm, StageFormData } from "./StageForm";
import { DEFAULT_STAGE_COLOR } from "@/lib/constants/stages";

interface EditStageDialogProps {
  stage: Stage | null;
  isOpen: boolean;
  onClose: () => void;
}

export function EditStageDialog({
  stage,
  isOpen,
  onClose,
}: EditStageDialogProps) {
  const updateStageMutation = useUpdateStageMutation();

  async function handleSubmit(data: StageFormData) {
    if (!stage) return;

    await updateStageMutation.mutateAsync({
      stageId: stage.id,
      stageData: {
        name: data.name,
        stage_order: data.stage_order,
        color: data.color,
      },
    });
    onClose();
  }

  if (!stage) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Stage</DialogTitle>
          <DialogDescription>
            Update the stage name and details.
          </DialogDescription>
        </DialogHeader>
        <StageForm
          initialData={{
            name: stage.name,
            stage_order: stage.stage_order || 0,
            color: stage.color || DEFAULT_STAGE_COLOR,
          }}
          onSubmit={handleSubmit}
          onCancel={onClose}
          submitLabel="Update"
        />
      </DialogContent>
    </Dialog>
  );
}
