import { Control, useWatch } from "react-hook-form";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { SetConfirmedTimeFields } from "./SetConfirmedTimeFields";
import { SetStatusField } from "./SetStatusField";
import { SetFormData } from "./setFormSchema";

interface SetTimingFieldsProps {
  control: Control<SetFormData>;
  timezone: string;
}

export function SetTimingFields({ control, timezone }: SetTimingFieldsProps) {
  const status = useWatch({ control, name: "status" });
  const isTba = status === "tba";

  return (
    <>
      <p className="text-xs text-muted-foreground">Times in {timezone}</p>
      <div className="grid grid-cols-3 gap-4">
        <SetStatusField control={control} />
        {isTba ? (
          <FormField
            control={control}
            name="tba_date"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Date</FormLabel>
                <FormControl>
                  <Input type="date" {...field} />
                </FormControl>
                <p className="text-xs text-muted-foreground mt-1">
                  Exact time isn't announced yet
                </p>
                <FormMessage />
              </FormItem>
            )}
          />
        ) : (
          <SetConfirmedTimeFields control={control} />
        )}
      </div>
    </>
  );
}
