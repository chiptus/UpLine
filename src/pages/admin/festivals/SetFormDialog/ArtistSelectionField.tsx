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
  onArtistsChange?: ((artistIds: string[]) => void) | undefined;
}

export function ArtistSelectionField({
  control,
  artists,
  onArtistsChange,
}: ArtistSelectionFieldProps) {
  return (
    <FormField
      control={control}
      name="artist_ids"
      render={({ field }) => (
        <FormItem>
          <FormLabel>Artists in Set</FormLabel>
          <FormControl>
            <ArtistMultiSelect
              artists={artists}
              value={field.value || []}
              onValueChange={(artistIds) => {
                field.onChange(artistIds);
                onArtistsChange?.(artistIds);
              }}
              placeholder="Select artists for this set..."
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
