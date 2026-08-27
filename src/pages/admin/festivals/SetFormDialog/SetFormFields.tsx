import { Control } from "react-hook-form";
import { type SetType } from "@/api/sets/types";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { StageSelector } from "../StageSelector";
import { ArtistSelectionField } from "./ArtistSelectionField";
import { SetNameField } from "./SetNameField";
import { SetTimingFields } from "./SetTimingFields";
import { SetTypeField } from "./SetTypeField";
import { NamedArtist } from "./generateSetName";
import { SetFormData } from "./setFormSchema";

interface SetFormFieldsProps {
  control: Control<SetFormData>;
  artists: NamedArtist[];
  editionId: string;
  timezone: string;
  typeRequired?: boolean;
  isNonMusicSet?: boolean;
  onTypeChange?: (setType: SetType) => void;
  hasManuallyEditedName?: boolean;
  onManualNameEdit?: () => void;
  onArtistsChange?: (artistIds: string[]) => void;
}

export function SetFormFields({
  control,
  artists,
  editionId,
  timezone,
  typeRequired = false,
  isNonMusicSet = false,
  onTypeChange,
  hasManuallyEditedName = true,
  onManualNameEdit,
  onArtistsChange,
}: SetFormFieldsProps) {
  return (
    <>
      <SetTypeField
        control={control}
        required={typeRequired}
        onTypeChange={onTypeChange}
      />

      <ArtistSelectionField
        control={control}
        artists={artists}
        isNonMusicSet={isNonMusicSet}
        onArtistsChange={onArtistsChange}
      />

      <SetNameField
        control={control}
        hasManuallyEditedName={hasManuallyEditedName}
        isNonMusicSet={isNonMusicSet}
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

      <FormField
        control={control}
        name="external_url"
        render={({ field }) => (
          <FormItem>
            <FormLabel>External URL</FormLabel>
            <FormControl>
              <Input placeholder="https://example.com/sign-up" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <SetTimingFields control={control} timezone={timezone} />
    </>
  );
}
