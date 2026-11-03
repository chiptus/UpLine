import { z } from "zod";
import { isValidSlug } from "@/lib/slug";

export const editionFormSchema = z.object({
  name: z.string().trim().min(1, "Edition name is required"),
  slug: z
    .string()
    .min(1, "Edition slug is required")
    .refine(
      isValidSlug,
      "Slug must contain only lowercase letters, numbers, and hyphens",
    ),
  year: z
    .number({ invalid_type_error: "Enter a year between 2000 and 2100" })
    .int("Enter a whole year")
    .min(2000, "Year must be between 2000 and 2100")
    .max(2100, "Year must be between 2000 and 2100"),
  start_date: z.string(),
  end_date: z.string(),
  published: z.boolean(),
  schedule_reveal_level: z.enum(["draft", "days", "stages", "full"]),
});

export type EditionFormData = z.infer<typeof editionFormSchema>;
