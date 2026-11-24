import { Control, useFormContext, useWatch } from "react-hook-form";
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { SlugFromNameButton } from "@/components/SlugFromNameButton";
import { Input } from "@/components/ui/input";
import { generateSlug, SLUG_TAKEN_MESSAGE } from "@/lib/slug";
import type { SetFormData } from "./setFormSchema";

interface SetSlugFieldProps {
  control: Control<SetFormData>;
  isTaken?: boolean;
}

export function SetSlugField({ control, isTaken = false }: SetSlugFieldProps) {
  const form = useFormContext<SetFormData>();
  const name = useWatch({ control, name: "name" });
  const slug = useWatch({ control, name: "slug" });

  return (
    <FormField
      control={control}
      name="slug"
      render={({ field }) => (
        <FormItem>
          <FormLabel>URL Slug</FormLabel>
          <div className="flex items-center gap-2">
            <FormControl>
              <Input placeholder="e.g., shpongle-live-set" {...field} />
            </FormControl>
            <SlugFromNameButton
              disabled={!name?.trim() || slug === generateSlug(name)}
              onClick={() =>
                form.setValue("slug", generateSlug(name), {
                  shouldValidate: true,
                  shouldDirty: true,
                })
              }
            />
          </div>
          <FormMessage />
          {isTaken && (
            <p className="text-sm font-medium text-destructive">
              {SLUG_TAKEN_MESSAGE}
            </p>
          )}
          <FormDescription>
            Changing the slug breaks existing links to this set. Renaming the
            set does not change it.
          </FormDescription>
        </FormItem>
      )}
    />
  );
}
