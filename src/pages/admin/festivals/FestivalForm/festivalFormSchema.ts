import { z } from "zod";
import { isValidSlug } from "@/lib/slug";

export const DEFAULT_FESTIVAL_TIMEZONE = "Europe/Lisbon";
export const DEFAULT_DAY_END_HOUR = 0;

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
  day_end_hour: z
    .number({ invalid_type_error: "Enter an hour from 0 to 23" })
    .int("Enter a whole hour")
    .min(0, "Hour must be between 0 and 23")
    .max(23, "Hour must be between 0 and 23"),
});

export type FestivalFormData = z.infer<typeof festivalFormSchema>;
