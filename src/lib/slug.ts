/**
 * Generate a URL-friendly slug from a string
 */
export function generateSlug(text: string): string {
  return (
    text
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

/**
 * Build the Nth candidate slug when disambiguating a collision:
 * attempt 1 is the bare slug, attempt 2+ appends a numeric counter.
 */
export function slugCandidate(baseSlug: string, attempt: number): string {
  return attempt <= 1 ? baseSlug : `${baseSlug}-${attempt}`;
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
