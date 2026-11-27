import { Control, useWatch } from "react-hook-form";
import { useEditionSlugTakenQuery } from "@/api/editions/useEditionSlugTaken";
import { useCheckableSlug } from "@/hooks/useCheckableSlug";
import type { EditionFormData } from "./editionFormSchema";

export interface ExistingEdition {
  festivalId: string;
  editionId: string;
}

/** Only an existing edition can collide with a sibling's slug while editing. */
export function useIsEditionSlugTaken(
  control: Control<EditionFormData>,
  currentSlug: string,
  existing: ExistingEdition | undefined,
) {
  const slug = useWatch({ control, name: "slug" });
  const checkableSlug = useCheckableSlug(slug, currentSlug);
  const { data: taken } = useEditionSlugTakenQuery(
    {
      festivalId: existing?.festivalId ?? "",
      slug: checkableSlug ?? "",
      excludeEditionId: existing?.editionId ?? "",
    },
    { enabled: checkableSlug !== null && !!existing },
  );
  return !!existing && checkableSlug !== null && taken === true;
}
