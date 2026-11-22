import { Control } from "react-hook-form";
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { SLUG_TAKEN_MESSAGE } from "@/lib/slug";
import type { SetFormData } from "./setFormSchema";

interface SetSlugFieldProps {
  control: Control<SetFormData>;
  isTaken?: boolean;
}

export function SetSlugField({ control, isTaken = false }: SetSlugFieldProps) {
  return (
    <FormField
      control={control}
      name="slug"
      render={({ field }) => (
        <FormItem>
          <FormLabel>URL Slug</FormLabel>
          <FormControl>
            <Input placeholder="e.g., shpongle-live-set" {...field} />
          </FormControl>
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
