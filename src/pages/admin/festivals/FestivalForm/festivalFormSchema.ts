import { z } from "zod";
import { Festival } from "@/api/festivals/types";
import { generateSlug, isValidSlug } from "@/lib/slug";

const DEFAULT_FESTIVAL_TIMEZONE = "Europe/Lisbon";

export const festivalFormSchema = z.object({
  name: z.string().trim().min(1, "Festival name is required"),
  slug: z
    .string()
    .min(1, "Festival slug is required")
    .refine(
      isValidSlug,
      "Slug must contain only lowercase letters, numbers, and hyphens",
    ),
  description: z.string(),
  published: z.boolean(),
  timezone: z.string(),
});

export type FestivalFormData = z.infer<typeof festivalFormSchema>;

export function getFestivalDefaultValues(
  festival: Festival | null,
): FestivalFormData {
  if (!festival) {
    return {
      name: "",
      slug: "",
      description: "",
      published: false,
      timezone: DEFAULT_FESTIVAL_TIMEZONE,
    };
  }
  return {
    name: festival.name,
    slug: festival.slug || generateSlug(festival.name),
    description: festival.description || "",
    published: festival.published || false,
    timezone: festival.timezone || DEFAULT_FESTIVAL_TIMEZONE,
  };
}
