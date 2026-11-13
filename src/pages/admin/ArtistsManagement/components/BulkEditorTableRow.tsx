import { TableRow, TableCell } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import type { Artist } from "@/api/artists/types";
import { SlugCell } from "../BulkEditor/SlugCell";
import { TextCell } from "../BulkEditor/TextCell";
import { TextareaCell } from "../BulkEditor/TextareaCell";
import { UrlCell } from "../BulkEditor/UrlCell";
import { GenresCell } from "../BulkEditor/GenresCell";
import { ImageCell } from "../BulkEditor/ImageCell";
import {
  UpdateArtistUpdates,
  useUpdateArtistMutation,
} from "@/api/artists/useUpdateArtist";

interface BulkEditorTableRowProps {
  artist: Artist;
  isSelected: boolean;
  onSelectChange: (isSelected: boolean) => void;
}

export function BulkEditorTableRow({
  artist,
  isSelected,
  onSelectChange,
}: BulkEditorTableRowProps) {
  // Centralized mutation hooks
  const updateArtistMutation = useUpdateArtistMutation();
  // Separate observer so other cell saves cannot drop the slug cell's
  // per-call callbacks (only the latest mutate call per observer fires them).
  const updateSlugMutation = useUpdateArtistMutation();
  // Centralized cell change handler with mutation
  function onSave<T extends keyof UpdateArtistUpdates>(
    field: T,
    newValue: UpdateArtistUpdates[T],
  ) {
    updateArtistMutation.mutate({
      id: artist.id,
      updates: { [field]: newValue },
    });
  }

  return (
    <TableRow>
      <TableCell>
        <Checkbox
          checked={isSelected}
          onCheckedChange={(checked) => onSelectChange(!!checked)}
        />
      </TableCell>
      <TableCell>
        <ImageCell
          value={artist.image_url}
          artistSlug={artist.slug}
          artistName={artist.name}
          onSave={(value) => onSave("image_url", value)}
        />
      </TableCell>
      <TableCell>
        <TextCell
          value={artist.name}
          required
          onSave={(value) => value && onSave("name", value)}
        />
      </TableCell>
      <TableCell>
        <SlugCell
          artistId={artist.id}
          value={artist.slug}
          onSave={(slug, callbacks) =>
            updateSlugMutation.mutate(
              { id: artist.id, updates: { slug } },
              callbacks,
            )
          }
        />
      </TableCell>
      <TableCell>
        <TextareaCell
          value={artist.description}
          onSave={(value) => onSave("description", value)}
        />
      </TableCell>
      <TableCell>
        <GenresCell
          value={artist.artist_music_genres?.map((g) => g.music_genre_id) || []}
          onSave={(value) => onSave("genre_ids", value)}
        />
      </TableCell>
      <TableCell>
        <UrlCell
          value={artist.spotify_url}
          placeholder="https://open.spotify.com/artist/..."
          onSave={(value) => onSave("spotify_url", value)}
        />
      </TableCell>
      <TableCell>
        <UrlCell
          value={artist.soundcloud_url}
          placeholder="https://soundcloud.com/..."
          onSave={(value) => onSave("soundcloud_url", value)}
        />
      </TableCell>

      <TableCell>
        <span className="text-xs text-muted-foreground">
          {new Date(artist.created_at).toLocaleDateString()}
        </span>
      </TableCell>
    </TableRow>
  );
}
