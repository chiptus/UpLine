import { md5 } from "./md5";

/**
 * Generate a URL-friendly slug from a string. Falls back to a deterministic
 * hash-based slug when there are no ASCII alphanumerics to keep (e.g.
 * non-Latin names, punctuation-only input) — mirrors the fallback in
 * `public.slugify()` (the `slugify_non_empty_fallback` migration) and
 * `toSlug()` in `supabase/functions/diff-schedule/helpers.ts`.
 */
export function generateSlug(text: string): string {
  const normalized = text.toLowerCase().trim();
  const slug = normalized
    // Replace spaces and special chars with hyphens
    .replace(/[^a-z0-9]+/g, "-")
    // Remove leading/trailing hyphens
    .replace(/^-+|-+$/g, "")
    // Collapse multiple hyphens
    .replace(/-+/g, "-");

  return slug === "" ? `n-${md5(normalized).slice(0, 8)}` : slug;
}

/**
 * Validate that a slug is URL-safe
 */
export function isValidSlug(slug: string): boolean {
  // Allow lowercase letters, numbers, and hyphens
  // Must start and end with alphanumeric
  return /^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug);
}

/**
 * Clean up user input to make it a valid slug
 */
export function sanitizeSlug(input: string): string {
  return generateSlug(input);
}
