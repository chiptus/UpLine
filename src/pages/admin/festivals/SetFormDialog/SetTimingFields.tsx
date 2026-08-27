import { Control } from "react-hook-form";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { SetFormData } from "./setFormSchema";

interface SetTimingFieldsProps {
  control: Control<SetFormData>;
  timezone: string;
}

export function SetTimingFields({ control, timezone }: SetTimingFieldsProps) {
  return (
    <>
      <p className="text-xs text-muted-foreground">Times in {timezone}</p>
      <div className="grid grid-cols-3 gap-4">
        <FormField
          control={control}
          name="time_start"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Start Time</FormLabel>
              <FormControl>
                <Input type="datetime-local" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={control}
          name="time_end"
          render={({ field }) => (
            <FormItem>
              <FormLabel>End Time</FormLabel>
              <FormControl>
                <Input type="datetime-local" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={control}
          name="estimated_date"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Estimated Date</FormLabel>
              <FormControl>
                <Input
                  type="date"
                  placeholder="If exact time unknown"
                  {...field}
                />
              </FormControl>
              <p className="text-xs text-muted-foreground mt-1">
                Use when exact start/end times are unknown
              </p>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </>
  );
}
