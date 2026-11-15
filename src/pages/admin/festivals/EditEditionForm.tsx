import { FestivalEdition } from "@/api/editions/types";
import { useUpdateFestivalEditionMutation } from "@/api/editions/useUpdateFestivalEdition";
import { generateSlug } from "@/lib/slug";
import { isEditionSlugTaken } from "@/api/festivals/slugTaken";
import { useToast } from "@/hooks/use-toast";
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
  const { toast } = useToast();

  async function handleSubmit(values: EditionFormData) {
    // A failed pre-check must not block saving: the DB unique constraint is the backstop.
    const taken =
      values.slug !== edition.slug &&
      (await isEditionSlugTaken(values.slug, festivalId, edition.id).catch(
        () => false,
      ));
    if (taken) {
      toast({
        title: "Slug already taken",
        description:
          "Another edition of this festival uses this slug. Choose a different one.",
        variant: "destructive",
      });
      return;
    }

    updateEditionMutation.mutate(
      {
        editionId: edition.id,
        editionData: toEditionPayload(values, festivalId),
      },
      { onSuccess: onDone },
    );
  }

  return (
    <EditionForm
      defaultValues={getEditDefaults(edition)}
      submitLabel="Update"
      isSubmitting={updateEditionMutation.isPending}
      onSubmit={handleSubmit}
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
