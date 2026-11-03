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

export function EditionDateField({
  name,
  label,
}: {
  name: keyof Pick<EditionFormData, "start_date" | "end_date">;
  label: string;
}) {
  const form = useFormContext<EditionFormData>();

  return (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel>{label}</FormLabel>
          <FormControl>
            <Input type="date" {...field} />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
