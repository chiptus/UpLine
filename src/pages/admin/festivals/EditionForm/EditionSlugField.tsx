import { useFormContext } from "react-hook-form";
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { sanitizeSlug } from "@/lib/slug";
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
          <FormControl>
            <Input
              placeholder="e.g., boom-2025"
              {...field}
              onChange={(e) => field.onChange(sanitizeSlug(e.target.value))}
            />
          </FormControl>
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
