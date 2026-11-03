import { useCreateFestivalEditionMutation } from "@/api/editions/useCreateFestivalEdition";
import { EditionForm } from "./EditionForm/EditionForm";
import {
  EditionFormData,
  toEditionPayload,
} from "./EditionForm/editionFormSchema";

interface CreateEditionFormProps {
  festivalId: string;
  onDone: () => void;
}

export function CreateEditionForm({
  festivalId,
  onDone,
}: CreateEditionFormProps) {
  const createEditionMutation = useCreateFestivalEditionMutation();

  return (
    <EditionForm
      defaultValues={getCreateDefaults()}
      submitLabel="Create"
      isSubmitting={createEditionMutation.isPending}
      onSubmit={(values) =>
        createEditionMutation.mutate(toEditionPayload(values, festivalId), {
          onSuccess: onDone,
        })
      }
      onCancel={onDone}
    />
  );
}

function getCreateDefaults(): EditionFormData {
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
