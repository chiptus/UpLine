import { Control } from "react-hook-form";
import { SET_TYPES, type SetType } from "@/api/sets/types";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { setTypeLabels } from "@/lib/setTypeLabels";
import { SetFormData } from "./setFormSchema";

interface SetTypeFieldProps {
  control: Control<SetFormData>;
  onTypeChange?: ((setType: SetType) => void) | undefined;
}

export function SetTypeField({ control, onTypeChange }: SetTypeFieldProps) {
  return (
    <FormField
      control={control}
      name="set_type"
      render={({ field }) => (
        <FormItem>
          <FormLabel>
            Type <span className="text-destructive">*</span>
          </FormLabel>
          <Select
            value={field.value ?? ""}
            onValueChange={(value) => {
              const setType = value as SetType;
              field.onChange(setType);
              onTypeChange?.(setType);
            }}
          >
            <FormControl>
              <SelectTrigger>
                <SelectValue placeholder="Select a type..." />
              </SelectTrigger>
            </FormControl>
            <SelectContent>
              {SET_TYPES.map((value) => {
                const { label, icon: Icon } = setTypeLabels[value];
                return (
                  <SelectItem key={value} value={value}>
                    <span className="flex items-center gap-2">
                      <Icon className="h-4 w-4" /> {label}
                    </span>
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
