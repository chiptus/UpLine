import { Control, useWatch } from "react-hook-form";
import { useFestivalSlugTakenQuery } from "@/api/festivals/useFestivalSlugTaken";
import { useCheckableSlug } from "@/hooks/useCheckableSlug";
import type { FestivalFormData } from "./festivalFormSchema";

/** Only an existing festival can collide with another one's slug while editing. */
export function useIsFestivalSlugTaken(
  control: Control<FestivalFormData>,
  currentSlug: string,
  festivalId: string | undefined,
) {
  const slug = useWatch({ control, name: "slug" });
  const checkableSlug = useCheckableSlug(slug, currentSlug);
  const { data: taken } = useFestivalSlugTakenQuery(
    { slug: checkableSlug ?? "", excludeFestivalId: festivalId ?? "" },
    { enabled: checkableSlug !== null && !!festivalId },
  );
  return !!festivalId && checkableSlug !== null && taken === true;
}
