import { useFormContext } from "react-hook-form";
import {
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { SlugInput } from "@/components/SlugInput";
import { SlugFromNameButton } from "@/components/SlugFromNameButton";
import {
  generateSlug,
  isValidSlug,
  sanitizeSlug,
  SLUG_TAKEN_MESSAGE,
} from "@/lib/slug";
import type { FestivalFormData } from "./festivalFormSchema";

interface FestivalSlugFieldProps {
  isTaken?: boolean;
}

export function FestivalSlugField({ isTaken = false }: FestivalSlugFieldProps) {
  const form = useFormContext<FestivalFormData>();
  const name = form.watch("name");

  return (
    <FormField
      control={form.control}
      name="slug"
      render={({ field }) => (
        <FormItem>
          <FormLabel>URL Slug</FormLabel>
          <div className="flex gap-2">
            <SlugInput
              field={field}
              placeholder="e.g., boom-festival"
              isTaken={isTaken}
              takenMessageId="festival-slug-taken"
            />
            <SlugFromNameButton
              disabled={!name?.trim() || field.value === generateSlug(name)}
              onClick={() =>
                form.setValue("slug", generateSlug(name), {
                  shouldValidate: true,
                  shouldDirty: true,
                })
              }
            />
            {field.value && !isValidSlug(field.value) && (
              <Button
                type="button"
                variant="outline"
                onClick={() =>
                  form.setValue("slug", sanitizeSlug(field.value), {
                    shouldValidate: true,
                    shouldDirty: true,
                  })
                }
              >
                Slugify
              </Button>
            )}
          </div>
          <FormMessage />
          {isTaken && (
            <p
              id="festival-slug-taken"
              role="alert"
              className="text-sm font-medium text-destructive"
            >
              {SLUG_TAKEN_MESSAGE}
            </p>
          )}
          <FormDescription>
            This will be used in the URL: /festivals/
            {field.value || "your-slug"}
          </FormDescription>
        </FormItem>
      )}
    />
  );
}
