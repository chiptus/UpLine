import { useCreateFestivalMutation } from "@/api/festivals/useCreateFestival";
import { FestivalForm, getFestivalDefaultValues } from "./FestivalForm";

interface CreateFestivalFormProps {
  onDone: () => void;
}

export function CreateFestivalForm({ onDone }: CreateFestivalFormProps) {
  const createFestivalMutation = useCreateFestivalMutation();

  return (
    <FestivalForm
      defaultValues={getFestivalDefaultValues(null)}
      submitLabel="Create"
      isSubmitting={createFestivalMutation.isPending}
      onSubmit={(values) =>
        createFestivalMutation.mutate(
          { ...values, name: values.name.trim() },
          { onSuccess: onDone },
        )
      }
      onCancel={onDone}
    />
  );
}
