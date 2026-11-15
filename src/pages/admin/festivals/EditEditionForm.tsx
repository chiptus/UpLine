import { useEffect, useRef } from "react";
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
  const submitInFlight = useRef(false);
  const abortController = useRef<AbortController | null>(null);

  // Closing the dialog mid-lookup must not let the edit save afterwards.
  useEffect(() => {
    const controller = new AbortController();
    abortController.current = controller;
    return () => controller.abort();
  }, []);

  async function handleSubmit(values: EditionFormData) {
    // The slug lookup runs before the mutation, so isPending alone can't stop a double submit.
    if (submitInFlight.current) return;
    submitInFlight.current = true;
    const signal = abortController.current?.signal;
    let mutationStarted = false;
    try {
      // A failed pre-check must not block saving: the DB unique constraint is the backstop.
      const taken =
        values.slug !== edition.slug &&
        (await isEditionSlugTaken(
          values.slug,
          festivalId,
          edition.id,
          signal,
        ).catch(() => false));
      if (signal?.aborted) return;
      if (taken) {
        toast({
          title: "Slug already taken",
          description:
            "Another edition of this festival uses this slug. Choose a different one.",
          variant: "destructive",
        });
        return;
      }

      mutationStarted = true;
      updateEditionMutation.mutate(
        {
          editionId: edition.id,
          editionData: toEditionPayload(values, festivalId),
        },
        {
          onSuccess: onDone,
          onSettled: () => {
            submitInFlight.current = false;
          },
        },
      );
    } finally {
      if (!mutationStarted) submitInFlight.current = false;
    }
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
