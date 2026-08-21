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
import type { LinkStepData } from "./LinkWizardStep";

const URL_FIELDS: {
  fieldName: "providerUrl.spotify" | "providerUrl.soundcloud";
  label: string;
  placeholder: string;
}[] = [
  {
    fieldName: "providerUrl.spotify",
    label: "Spotify URL",
    placeholder: "https://open.spotify.com/artist/...",
  },
  {
    fieldName: "providerUrl.soundcloud",
    label: "SoundCloud URL",
    placeholder: "https://soundcloud.com/...",
  },
];

interface StagedFieldsPreviewProps {
  form: UseFormReturn<LinkStepData>;
}

export function StagedFieldsPreview({ form }: StagedFieldsPreviewProps) {
  const imageUrl = form.watch("image_url");
  const description = form.watch("description");

  return (
    <div className="space-y-3 rounded-lg border p-3">
      <p className="text-sm font-medium">Staged</p>

      {URL_FIELDS.map(({ fieldName, label, placeholder }) => (
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
                  value={field.value || ""}
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
            {description !== undefined && (
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea
                        value={field.value ?? ""}
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
