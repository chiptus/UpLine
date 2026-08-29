import type { UseFormReturn } from "react-hook-form";
import { Textarea } from "@/components/ui/textarea";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from "@/components/ui/form";
import type { LinkStepData } from "./LinkWizardStep";
import type { Candidate, Provider } from "@/api/artistSearch/types";
import type { SelectableField } from "@/api/artistSearch/mergeCandidateSelection";
import { ProviderUrlField } from "./ProviderUrlField";

const URL_FIELDS: {
  fieldName: "providerUrl.spotify" | "providerUrl.soundcloud";
  label: string;
  placeholder: string;
  provider: Provider;
}[] = [
  {
    fieldName: "providerUrl.spotify",
    label: "Spotify URL",
    placeholder: "https://open.spotify.com/artist/...",
    provider: "spotify",
  },
  {
    fieldName: "providerUrl.soundcloud",
    label: "SoundCloud URL",
    placeholder: "https://soundcloud.com/...",
    provider: "soundcloud",
  },
];

interface StagedFieldsPreviewProps {
  form: UseFormReturn<LinkStepData>;
  onSelectCandidate: (
    candidate: Candidate,
    provider: Provider,
    fields: SelectableField[],
  ) => void;
}

export function StagedFieldsPreview({
  form,
  onSelectCandidate,
}: StagedFieldsPreviewProps) {
  const imageUrl = form.watch("image_url");
  const description = form.watch("description");

  return (
    <div className="space-y-3 rounded-lg border p-3">
      <p className="text-sm font-medium">Staged</p>

      {URL_FIELDS.map(({ fieldName, label, placeholder, provider }) => (
        <ProviderUrlField
          key={fieldName}
          form={form}
          fieldName={fieldName}
          label={label}
          placeholder={placeholder}
          provider={provider}
          onSelectCandidate={onSelectCandidate}
        />
      ))}

      {(imageUrl || description !== undefined) && (
        <div className="flex items-start gap-3 text-sm">
          {imageUrl && (
            <img
              src={imageUrl}
              alt="Staged artist image"
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
