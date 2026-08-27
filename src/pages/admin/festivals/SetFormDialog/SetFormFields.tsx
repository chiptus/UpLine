import { Control } from "react-hook-form";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { StageSelector } from "../StageSelector";
import { ArtistSelectionField } from "./ArtistSelectionField";
import { SetNameField } from "./SetNameField";
import { SetTimingFields } from "./SetTimingFields";
import { NamedArtist } from "./generateSetName";
import { SetFormData } from "./setFormSchema";

interface SetFormFieldsProps {
  control: Control<SetFormData>;
  artists: NamedArtist[];
  editionId: string;
  timezone: string;
  hasManuallyEditedName?: boolean;
  onManualNameEdit?: () => void;
  onArtistsChange?: (artistIds: string[]) => void;
}

export function SetFormFields({
  control,
  artists,
  editionId,
  timezone,
  hasManuallyEditedName = true,
  onManualNameEdit,
  onArtistsChange,
}: SetFormFieldsProps) {
  return (
    <>
      <ArtistSelectionField
        control={control}
        artists={artists}
        onArtistsChange={onArtistsChange}
      />

      <SetNameField
        control={control}
        hasManuallyEditedName={hasManuallyEditedName}
        onManualEdit={onManualNameEdit}
      />

      <FormField
        control={control}
        name="stage_id"
        render={({ field }) => (
          <StageSelector
            editionId={editionId}
            value={field.value}
            onValueChange={field.onChange}
          />
        )}
      />

      <FormField
        control={control}
        name="description"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Description</FormLabel>
            <FormControl>
              <Textarea placeholder="Set description..." rows={2} {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <SetTimingFields control={control} timezone={timezone} />
    </>
  );
}
