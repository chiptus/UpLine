import { z } from "zod";
import { isValidSlug } from "./slug";

/**
 * Validates a user-typed slug without rewriting it: sanitizing on every
 * keystroke strips a just-typed trailing hyphen, making mid-slug dashes
 * impossible to enter.
 */
export const slugFieldSchema = z
  .string()
  .trim()
  .min(1, "Slug is required")
  .refine(
    isValidSlug,
    "Slug must contain only lowercase letters, numbers, and single hyphens between them",
  );
