import { useFormContext } from "react-hook-form";
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
} from "@/components/ui/form";
import { Switch } from "@/components/ui/switch";
import type { FestivalFormData } from "./festivalFormSchema";

export function FestivalPublishedField() {
  const form = useFormContext<FestivalFormData>();

  return (
    <FormField
      control={form.control}
      name="published"
      render={({ field }) => (
        <FormItem className="flex items-center space-x-2 space-y-0">
          <FormControl>
            <Switch checked={field.value} onCheckedChange={field.onChange} />
          </FormControl>
          <FormLabel>Published</FormLabel>
          <FormDescription className="!mt-0">
            {field.value ? "Visible to public users" : "Only visible to admins"}
          </FormDescription>
        </FormItem>
      )}
    />
  );
}
