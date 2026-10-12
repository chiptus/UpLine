import { useUpdateFestivalMutation } from "@/api/festivals/useUpdateFestival";
import { Festival } from "@/api/festivals/types";
import { FestivalForm } from "./FestivalForm/FestivalForm";
import {
  DEFAULT_FESTIVAL_TIMEZONE,
  FestivalFormData,
} from "./FestivalForm/festivalFormSchema";
import { generateSlug } from "@/lib/slug";

interface EditFestivalFormProps {
  festival: Festival;
  onDone: () => void;
}

export function EditFestivalForm({ festival, onDone }: EditFestivalFormProps) {
  const updateFestivalMutation = useUpdateFestivalMutation();

  return (
    <FestivalForm
      defaultValues={getEditDefaults(festival)}
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

function getEditDefaults(festival: Festival): FestivalFormData {
  return {
    name: festival.name,
    slug: festival.slug || generateSlug(festival.name),
    description: festival.description || "",
    published: festival.published || false,
    timezone: festival.timezone || DEFAULT_FESTIVAL_TIMEZONE,
  };
}
