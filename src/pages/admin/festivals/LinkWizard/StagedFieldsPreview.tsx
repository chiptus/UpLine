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
import type { CandidateUpdate } from "@/api/artistSearch/mergeCandidateSelection";

interface UrlFieldConfig {
  fieldName: string;
  label: string;
  placeholder: string;
}

interface StagedFieldsPreviewProps {
  form: UseFormReturn<Record<string, unknown>>;
  urlFields: UrlFieldConfig[];
  stagedUpdates: CandidateUpdate;
  onDescriptionChange: (description: string) => void;
}

export function StagedFieldsPreview({
  form,
  urlFields,
  stagedUpdates,
  onDescriptionChange,
}: StagedFieldsPreviewProps) {
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

      {(stagedUpdates.image_url || stagedUpdates.description !== undefined) && (
        <div className="flex items-start gap-3 text-sm">
          {stagedUpdates.image_url && (
            <img
              src={stagedUpdates.image_url}
              alt=""
              className="h-12 w-12 rounded object-cover"
            />
          )}
          <div className="flex-1 space-y-1">
            {stagedUpdates.image_url && (
              <p className="text-muted-foreground">
                Image staged from candidate
              </p>
            )}
            {stagedUpdates.description !== undefined && (
              <Textarea
                value={stagedUpdates.description ?? ""}
                onChange={(e) => onDescriptionChange(e.target.value)}
                rows={2}
                className="text-sm"
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}
