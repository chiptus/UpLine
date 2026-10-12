import { z } from "zod";
import { isValidSlug } from "@/lib/slug";

export const DEFAULT_FESTIVAL_TIMEZONE = "Europe/Lisbon";

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
