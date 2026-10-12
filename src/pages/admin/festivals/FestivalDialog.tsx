import { Festival } from "@/api/festivals/types";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { CreateFestivalForm } from "./CreateFestivalForm";
import { EditFestivalForm } from "./EditFestivalForm";

interface FestivalDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingFestival: Festival | null;
}

export function FestivalDialog({
  open,
  onOpenChange,
  editingFestival,
}: FestivalDialogProps) {
  function close() {
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {editingFestival ? "Edit Festival" : "Create New Festival"}
          </DialogTitle>
          <DialogDescription>
            {editingFestival
              ? "Update festival information including name, description, and settings."
              : "Create a new festival with basic information and publish settings."}
          </DialogDescription>
        </DialogHeader>
        {/* Keyed so switching festivals remounts the form with fresh defaults. */}
        {editingFestival ? (
          <EditFestivalForm
            key={editingFestival.id}
            festival={editingFestival}
            onDone={close}
          />
        ) : (
          <CreateFestivalForm onDone={close} />
        )}
      </DialogContent>
    </Dialog>
  );
}
