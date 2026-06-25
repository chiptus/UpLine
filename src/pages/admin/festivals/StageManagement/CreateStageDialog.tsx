import { useState } from "react";
import { useCreateStageMutation } from "@/api/stages/useCreateStage";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { StageForm, StageFormData } from "./StageForm";

interface CreateStageDialogProps {
  editionId: string;
}

export function CreateStageDialog({ editionId }: CreateStageDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const createStageMutation = useCreateStageMutation();

  async function handleSubmit(data: StageFormData) {
    await createStageMutation.mutateAsync({
      ...data,
      festival_edition_id: editionId,
    });
    setIsOpen(false);
  }

  function handleCancel() {
    setIsOpen(false);
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="bg-purple-600 hover:bg-purple-700">
          <Plus className="h-4 w-4 mr-2" />
          Add Stage
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create New Stage</DialogTitle>
          <DialogDescription>
            Create a new stage where artists will perform.
          </DialogDescription>
        </DialogHeader>
        <StageForm
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          submitLabel="Create"
        />
      </DialogContent>
    </Dialog>
  );
}
