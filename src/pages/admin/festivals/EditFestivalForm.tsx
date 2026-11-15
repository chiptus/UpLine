import { useUpdateFestivalMutation } from "@/api/festivals/useUpdateFestival";
import { Festival } from "@/api/festivals/types";
import { FestivalForm } from "./FestivalForm/FestivalForm";
import {
  DEFAULT_DAY_END_HOUR,
  DEFAULT_FESTIVAL_TIMEZONE,
  FestivalFormData,
} from "./FestivalForm/festivalFormSchema";
import { generateSlug } from "@/lib/slug";
import { isFestivalSlugTaken } from "@/api/festivals/slugTaken";
import { useToast } from "@/hooks/use-toast";

interface EditFestivalFormProps {
  festival: Festival;
  onDone: () => void;
}

export function EditFestivalForm({ festival, onDone }: EditFestivalFormProps) {
  const updateFestivalMutation = useUpdateFestivalMutation();
  const { toast } = useToast();

  async function handleSubmit(values: FestivalFormData) {
    // A failed pre-check must not block saving: the DB unique constraint is the backstop.
    const taken =
      values.slug !== festival.slug &&
      (await isFestivalSlugTaken(values.slug, festival.id).catch(() => false));
    if (taken) {
      toast({
        title: "Slug already taken",
        description: "Another festival uses this slug. Choose a different one.",
        variant: "destructive",
      });
      return;
    }

    updateFestivalMutation.mutate(
      {
        festivalId: festival.id,
        festivalData: { ...values, name: values.name.trim() },
      },
      { onSuccess: onDone },
    );
  }

  return (
    <FestivalForm
      defaultValues={getEditDefaults(festival)}
      submitLabel="Update"
      isSubmitting={updateFestivalMutation.isPending}
      onSubmit={handleSubmit}
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
    day_end_hour: festival.day_end_hour ?? DEFAULT_DAY_END_HOUR,
  };
}
