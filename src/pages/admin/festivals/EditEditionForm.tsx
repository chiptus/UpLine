import { FestivalEdition } from "@/api/editions/types";
import { useUpdateFestivalEditionMutation } from "@/api/editions/useUpdateFestivalEdition";
import { generateSlug } from "@/lib/slug";
import { EditionForm } from "./EditionForm/EditionForm";
import {
  EditionFormData,
  toEditionPayload,
} from "./EditionForm/editionFormSchema";

interface EditEditionFormProps {
  edition: FestivalEdition;
  festivalId: string;
  onDone: () => void;
}

export function EditEditionForm({
  edition,
  festivalId,
  onDone,
}: EditEditionFormProps) {
  const updateEditionMutation = useUpdateFestivalEditionMutation();

  return (
    <EditionForm
      defaultValues={getEditDefaults(edition)}
      submitLabel="Update"
      isSubmitting={updateEditionMutation.isPending}
      onSubmit={(values) =>
        updateEditionMutation.mutate(
          {
            editionId: edition.id,
            editionData: toEditionPayload(values, festivalId),
          },
          { onSuccess: onDone },
        )
      }
      onCancel={onDone}
    />
  );
}

function getEditDefaults(edition: FestivalEdition): EditionFormData {
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
