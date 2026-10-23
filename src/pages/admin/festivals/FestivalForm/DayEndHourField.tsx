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
import type { FestivalFormData } from "./festivalFormSchema";

export function DayEndHourField() {
  const { control } = useFormContext<FestivalFormData>();

  return (
    <FormField
      control={control}
      name="day_end_hour"
      render={({ field }) => (
        <FormItem>
          <FormLabel>Day end hour</FormLabel>
          <FormControl>
            <Input
              type="number"
              min={0}
              max={23}
              {...field}
              value={Number.isNaN(field.value) ? "" : field.value}
              onChange={(e) => field.onChange(e.target.valueAsNumber)}
            />
          </FormControl>
          <FormDescription>
            The hour (in the festival timezone) the festival day ends. Sets
            before it belong to the previous day. 0 ends days at midnight.
          </FormDescription>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
