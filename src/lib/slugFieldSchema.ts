import { z } from "zod";
import { getSlugError } from "./slug";

/**
 * Validates a user-typed slug without rewriting it: sanitizing on every
 * keystroke strips a just-typed trailing hyphen, making mid-slug dashes
 * impossible to enter.
 */
export const slugFieldSchema = z
  .string()
  .trim()
  .min(1, "Slug is required")
  .superRefine((slug, ctx) => {
    const message = getSlugError(slug);
    if (message) ctx.addIssue({ code: z.ZodIssueCode.custom, message });
  });
