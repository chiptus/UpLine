import { useFormContext } from "react-hook-form";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { generateSlug } from "@/lib/slug";
import type { EditionFormData } from "./editionFormSchema";

export function EditionNameField() {
  const form = useFormContext<EditionFormData>();

  function followNameWithSlug(name: string) {
    // The slug follows the name until it's edited directly, i.e. while it
    // still equals the slug derived from the previous name.
    const { name: prevName, slug } = form.getValues();
    if (slug === "" || slug === generateSlug(prevName)) {
      form.setValue("slug", generateSlug(name), { shouldValidate: true });
    }
  }

  return (
    <FormField
      control={form.control}
      name="name"
      render={({ field }) => (
        <FormItem>
          <FormLabel>Edition Name</FormLabel>
          <FormControl>
            <Input
              placeholder="e.g., Boom Festival 2025"
              {...field}
              onChange={(e) => {
                // Must run before field.onChange: it compares against the previous name.
                followNameWithSlug(e.target.value);
                field.onChange(e);
              }}
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
