import { useFormContext } from "react-hook-form";
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SlugFromNameButton } from "@/components/SlugFromNameButton";
import {
  generateSlug,
  isValidSlug,
  sanitizeSlug,
  SLUG_TAKEN_MESSAGE,
} from "@/lib/slug";
import type { EditionFormData } from "./editionFormSchema";

interface EditionSlugFieldProps {
  isTaken?: boolean;
}

export function EditionSlugField({ isTaken = false }: EditionSlugFieldProps) {
  const form = useFormContext<EditionFormData>();
  const name = form.watch("name");

  return (
    <FormField
      control={form.control}
      name="slug"
      render={({ field }) => (
        <FormItem>
          <FormLabel>URL Slug</FormLabel>
          <div className="flex gap-2">
            <FormControl>
              <Input
                placeholder="e.g., boom-2025"
                {...field}
                onChange={(e) => {
                  field.onChange(e);
                  form.trigger("slug");
                }}
              />
            </FormControl>
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
            <p className="text-sm font-medium text-destructive">
              {SLUG_TAKEN_MESSAGE}
            </p>
          )}
          <FormDescription>
            This will be used in the URL: /festivals/festival-name/editions/
            {field.value || "your-slug"}
          </FormDescription>
        </FormItem>
      )}
    />
  );
}
