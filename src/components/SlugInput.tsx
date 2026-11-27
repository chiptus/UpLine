import { useFormContext } from "react-hook-form";
import { FormControl, useFormField } from "@/components/ui/form";
import { Input } from "@/components/ui/input";

interface SlugInputProps {
  field: {
    value: string;
    name: string;
    ref: React.Ref<HTMLInputElement>;
    onChange: React.ChangeEventHandler<HTMLInputElement>;
    onBlur: () => void;
  };
  placeholder: string;
  isTaken: boolean;
  takenMessageId: string;
}

export function SlugInput({
  field,
  placeholder,
  isTaken,
  takenMessageId,
}: SlugInputProps) {
  const form = useFormContext<{ slug: string }>();
  const { error, formDescriptionId, formMessageId } = useFormField();

  const describedBy = [
    formDescriptionId,
    error ? formMessageId : null,
    isTaken ? takenMessageId : null,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <FormControl>
      <Input
        placeholder={placeholder}
        {...field}
        aria-invalid={!!error || isTaken}
        aria-describedby={describedBy}
        onChange={(e) => {
          field.onChange(e);
          form.trigger("slug");
        }}
      />
    </FormControl>
  );
}
