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

interface SetNameFieldProps {
  control: Control<SetFormData>;
  hasManuallyEditedName: boolean;
  isNonMusicSet?: boolean;
  onManualEdit?: (() => void) | undefined;
}

export function SetNameField({
  control,
  hasManuallyEditedName,
  isNonMusicSet = false,
  onManualEdit,
}: SetNameFieldProps) {
  return (
    <FormField
      control={control}
      name="name"
      render={({ field }) => (
        <FormItem>
          <FormLabel>Set Name</FormLabel>
          <FormControl>
            <Input
              placeholder="e.g., Shpongle Live Set"
              {...field}
              onChange={(e) => {
                field.onChange(e);
                onManualEdit?.();
              }}
            />
          </FormControl>
          {!hasManuallyEditedName && !isNonMusicSet && (
            <p className="text-xs text-muted-foreground">
              Name will be auto-generated from selected artists
            </p>
          )}
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
