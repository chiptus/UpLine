import { useCreateFestivalMutation } from "@/api/festivals/useCreateFestival";
import { FestivalForm } from "./FestivalForm/FestivalForm";
import {
  DEFAULT_DAY_END_HOUR,
  DEFAULT_FESTIVAL_TIMEZONE,
  FestivalFormData,
} from "./FestivalForm/festivalFormSchema";

interface CreateFestivalFormProps {
  onDone: () => void;
}

export function CreateFestivalForm({ onDone }: CreateFestivalFormProps) {
  const createFestivalMutation = useCreateFestivalMutation();

  return (
    <FestivalForm
      defaultValues={getCreateDefaults()}
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

function getCreateDefaults(): FestivalFormData {
  return {
    name: "",
    slug: "",
    description: "",
    published: false,
    timezone: DEFAULT_FESTIVAL_TIMEZONE,
    day_end_hour: DEFAULT_DAY_END_HOUR,
  };
}
