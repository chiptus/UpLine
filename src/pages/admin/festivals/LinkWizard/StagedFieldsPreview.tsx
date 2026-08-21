import type { UseFormReturn } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

interface UrlFieldConfig {
  fieldName: string;
  label: string;
  placeholder: string;
}

interface StagedFieldsPreviewProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  form: UseFormReturn<any>;
  urlFields: UrlFieldConfig[];
}

export function StagedFieldsPreview({
  form,
  urlFields,
}: StagedFieldsPreviewProps) {
  const imageUrl = form.watch("image_url") as string | null | undefined;
  const description = form.watch("description") as string | null | undefined;

  return (
    <div className="space-y-3 rounded-lg border p-3">
      <p className="text-sm font-medium">Staged</p>

      {urlFields.map(({ fieldName, label, placeholder }) => (
        <FormField
          key={fieldName}
          control={form.control}
          name={fieldName}
          render={({ field }) => (
            <FormItem>
              <FormLabel>{label}</FormLabel>
              <FormControl>
                <Input
                  type="url"
                  placeholder={placeholder}
                  value={(field.value as string) || ""}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                  name={field.name}
                  ref={field.ref}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      ))}

      {(imageUrl || description !== undefined) && (
        <div className="flex items-start gap-3 text-sm">
          {imageUrl && (
            <img
              src={imageUrl}
              alt=""
              className="h-12 w-12 rounded object-cover"
            />
          )}
          <div className="flex-1 space-y-1">
            {imageUrl && (
              <p className="text-muted-foreground">
                Image staged from candidate
              </p>
            )}
            {description !== undefined && (
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Textarea
                        value={(field.value as string) ?? ""}
                        onChange={field.onChange}
                        onBlur={field.onBlur}
                        name={field.name}
                        ref={field.ref}
                        rows={2}
                        className="text-sm"
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}
