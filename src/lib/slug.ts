import md5 from "blueimp-md5";

/**
 * Generate a URL-friendly slug from a string. Falls back to a deterministic
 * hash-based slug when there are no ASCII alphanumerics to keep (e.g.
 * non-Latin names, punctuation-only input) — mirrors the fallback in
 * `public.slugify()` (the `slugify_non_empty_fallback` migration) and
 * `toSlug()` in `supabase/functions/diff-schedule/helpers.ts`.
 */
export function generateSlug(text: string): string {
  const slug = sanitizeSlug(text);

  return slug === "" ? `n-${md5(text.toLowerCase().trim()).slice(0, 8)}` : slug;
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
 * Clean up a user-typed slug field. Unlike `generateSlug` (which derives a
 * slug from a name and must never be empty), this preserves blank input: a
 * manually-controlled slug field being cleared means "not set yet", and
 * hashing that would silently save an unrelated value and bypass the
 * "slug is required" validation that field already has.
 */
export function sanitizeSlug(input: string): string {
  return (
    input
      .toLowerCase()
      .trim()
      // Replace spaces and special chars with hyphens
      .replace(/[^a-z0-9]+/g, "-")
      // Remove leading/trailing hyphens
      .replace(/^-+|-+$/g, "")
      // Collapse multiple hyphens
      .replace(/-+/g, "-")
  );
}
