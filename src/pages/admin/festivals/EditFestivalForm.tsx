import { useUpdateFestivalMutation } from "@/api/festivals/useUpdateFestival";
import { Festival } from "@/api/festivals/types";
import { FestivalForm } from "./FestivalForm/FestivalForm";
import { getFestivalDefaultValues } from "./FestivalForm/festivalFormSchema";

interface EditFestivalFormProps {
  festival: Festival;
  onDone: () => void;
}

export function EditFestivalForm({ festival, onDone }: EditFestivalFormProps) {
  const updateFestivalMutation = useUpdateFestivalMutation();

  return (
    <FestivalForm
      defaultValues={getFestivalDefaultValues(festival)}
      submitLabel="Update"
      isSubmitting={updateFestivalMutation.isPending}
      onSubmit={(values) =>
        updateFestivalMutation.mutate(
          {
            festivalId: festival.id,
            festivalData: { ...values, name: values.name.trim() },
          },
          { onSuccess: onDone },
        )
      }
      onCancel={onDone}
    />
  );
}
