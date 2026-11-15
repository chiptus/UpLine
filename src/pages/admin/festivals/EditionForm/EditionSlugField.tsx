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
import { isValidSlug, sanitizeSlug } from "@/lib/slug";
import type { EditionFormData } from "./editionFormSchema";

export function EditionSlugField() {
  const form = useFormContext<EditionFormData>();

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
          <FormDescription>
            This will be used in the URL: /festivals/festival-name/editions/
            {field.value || "your-slug"}
          </FormDescription>
        </FormItem>
      )}
    />
  );
}
