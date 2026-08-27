import { Control } from "react-hook-form";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { ArtistMultiSelect } from "../SetsManagement/ArtistMultiSelect";
import { NamedArtist } from "./generateSetName";
import { SetFormData } from "./setFormSchema";

interface ArtistSelectionFieldProps {
  control: Control<SetFormData>;
  artists: NamedArtist[];
  isNonMusicSet?: boolean;
  onArtistsChange?: ((artistIds: string[]) => void) | undefined;
}

export function ArtistSelectionField({
  control,
  artists,
  isNonMusicSet = false,
  onArtistsChange,
}: ArtistSelectionFieldProps) {
  return (
    <FormField
      control={control}
      name="artist_ids"
      render={({ field }) => (
        <FormItem>
          <FormLabel>
            {isNonMusicSet ? "Artists (optional)" : "Artists in Set"}
          </FormLabel>
          <FormControl>
            <ArtistMultiSelect
              artists={artists}
              value={field.value || []}
              onValueChange={(artistIds) => {
                field.onChange(artistIds);
                onArtistsChange?.(artistIds);
              }}
              placeholder={
                isNonMusicSet
                  ? "Link facilitators/performers if they exist as artists..."
                  : "Select artists for this set..."
              }
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
