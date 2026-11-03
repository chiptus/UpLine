import { useFormContext } from "react-hook-form";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import type { EditionFormData } from "./editionFormSchema";

export function EditionYearField() {
  const form = useFormContext<EditionFormData>();

  return (
    <FormField
      control={form.control}
      name="year"
      render={({ field }) => (
        <FormItem>
          <FormLabel>Year</FormLabel>
          <FormControl>
            <Input
              type="number"
              min="2000"
              max="2100"
              {...field}
              value={Number.isNaN(field.value) ? "" : field.value}
              onChange={(e) => field.onChange(e.target.valueAsNumber)}
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
