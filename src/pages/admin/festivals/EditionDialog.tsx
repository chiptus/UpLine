import { FestivalEdition } from "@/api/editions/types";
import { useCreateFestivalEditionMutation } from "@/api/editions/useCreateFestivalEdition";
import { useUpdateFestivalEditionMutation } from "@/api/editions/useUpdateFestivalEdition";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { generateSlug } from "@/lib/slug";
import { EditionForm } from "./EditionForm/EditionForm";
import { EditionFormData } from "./EditionForm/editionFormSchema";

interface EditionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  festivalId: string;
  editingEdition: FestivalEdition | null;
}

export function EditionDialog({
  open,
  onOpenChange,
  festivalId,
  editingEdition,
}: EditionDialogProps) {
  const createEditionMutation = useCreateFestivalEditionMutation();
  const updateEditionMutation = useUpdateFestivalEditionMutation();
  const isSubmitting =
    createEditionMutation.isPending || updateEditionMutation.isPending;

  function close() {
    onOpenChange(false);
  }

  function handleSubmit(values: EditionFormData) {
    const editionData = {
      ...values,
      name: values.name.trim(),
      start_date: values.start_date || null,
      end_date: values.end_date || null,
      festival_id: festivalId,
    };

    if (editingEdition) {
      updateEditionMutation.mutate(
        { editionId: editingEdition.id, editionData },
        { onSuccess: close },
      );
    } else {
      createEditionMutation.mutate(editionData, { onSuccess: close });
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {editingEdition
              ? "Edit Festival Edition"
              : "Create New Festival Edition"}
          </DialogTitle>
          <DialogDescription>
            {editingEdition
              ? "Update edition information including name, dates, and visibility settings."
              : "Create a new festival edition with dates and publish settings."}
          </DialogDescription>
        </DialogHeader>
        {/* Dialog content unmounts on close, so every open starts from fresh defaults. */}
        <EditionForm
          defaultValues={getDefaults(editingEdition)}
          submitLabel={editingEdition ? "Update" : "Create"}
          isSubmitting={isSubmitting}
          onSubmit={handleSubmit}
          onCancel={close}
        />
      </DialogContent>
    </Dialog>
  );
}

function getDefaults(edition: FestivalEdition | null): EditionFormData {
  if (!edition) {
    return {
      name: "",
      slug: "",
      year: new Date().getFullYear(),
      start_date: "",
      end_date: "",
      published: false,
      schedule_reveal_level: "draft",
    };
  }

  return {
    name: edition.name,
    slug: edition.slug || generateSlug(edition.name),
    year: edition.year,
    start_date: edition.start_date || "",
    end_date: edition.end_date || "",
    published: edition.published || false,
    schedule_reveal_level: edition.schedule_reveal_level ?? "draft",
  };
}
