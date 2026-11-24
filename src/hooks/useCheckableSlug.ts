import { useEffect, useState } from "react";
import { isValidSlug } from "@/lib/slug";

const DEBOUNCE_MS = 300;

/**
 * The slug worth an availability lookup, or null while the user is still
 * typing, the slug is malformed, or it is unchanged. Gating on the debounced
 * value keeps a lookup from firing per keystroke.
 */
export function useCheckableSlug(
  slug: string,
  currentSlug: string,
): string | null {
  const trimmed = slug.trim();
  const [settled, setSettled] = useState(trimmed);

  useEffect(() => {
    const timeout = setTimeout(() => setSettled(trimmed), DEBOUNCE_MS);
    return () => clearTimeout(timeout);
  }, [trimmed]);

  if (settled !== trimmed) return null;
  if (trimmed === currentSlug || !isValidSlug(trimmed)) return null;
  return trimmed;
}
