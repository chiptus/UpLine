import { useEffect, useRef } from "react";
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
  const submitInFlight = useRef(false);
  const abortController = useRef<AbortController | null>(null);

  // Closing the dialog mid-lookup must not let the edit save afterwards.
  useEffect(() => {
    const controller = new AbortController();
    abortController.current = controller;
    return () => controller.abort();
  }, []);

  async function handleSubmit(values: FestivalFormData) {
    // The slug lookup runs before the mutation, so isPending alone can't stop a double submit.
    if (submitInFlight.current) return;
    submitInFlight.current = true;
    const signal = abortController.current?.signal;
    let mutationStarted = false;
    try {
      // A failed pre-check must not block saving: the DB unique constraint is the backstop.
      const taken =
        values.slug !== festival.slug &&
        (await isFestivalSlugTaken(values.slug, festival.id, signal).catch(
          () => false,
        ));
      if (signal?.aborted) return;
      if (taken) {
        toast({
          title: "Slug already taken",
          description:
            "Another festival uses this slug. Choose a different one.",
          variant: "destructive",
        });
        return;
      }

      mutationStarted = true;
      updateFestivalMutation.mutate(
        {
          festivalId: festival.id,
          festivalData: { ...values, name: values.name.trim() },
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
