import { useCallback, useState } from "react";
import { generateSlug, isValidSlug, sanitizeSlug } from "@/lib/slug";

interface SlugFieldValues {
  name: string;
  slug: string;
}

const EMPTY_VALUES: SlugFieldValues = { name: "", slug: "" };

/**
 * Name + slug pair for admin dialogs: the slug follows the name until the
 * user edits it directly (detected by it no longer matching the slug derived
 * from the current name).
 */
export function useSlugField() {
  const [values, setValues] = useState<SlugFieldValues>(EMPTY_VALUES);
  const [slugError, setSlugError] = useState("");

  function changeName(name: string) {
    setValues((prev) => ({
      name,
      slug:
        prev.slug === "" || prev.slug === generateSlug(prev.name)
          ? generateSlug(name)
          : prev.slug,
    }));
  }

  function changeSlug(input: string) {
    const slug = sanitizeSlug(input);
    setValues((prev) => ({ ...prev, slug }));
    setSlugError(
      slug && !isValidSlug(slug)
        ? "Slug must contain only lowercase letters, numbers, and hyphens"
        : "",
    );
  }

  // Stable so dialogs can call it from a reset-on-open effect.
  const reset = useCallback((next: SlugFieldValues = EMPTY_VALUES) => {
    setValues(next);
    setSlugError("");
  }, []);

  return {
    name: values.name,
    slug: values.slug,
    slugError,
    changeName,
    changeSlug,
    reset,
  };
}
