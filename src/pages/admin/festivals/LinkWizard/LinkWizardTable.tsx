import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { BulkEditorPagination } from "@/pages/admin/ArtistsManagement/components/BulkEditorPagination";
import type { AdminArtistsPageSize } from "@/pages/admin/ArtistsManagement/searchSchema";
import type { Artist } from "@/api/artists/types";
import { cn } from "@/lib/utils";

interface LinkWizardTableProps {
  artists: Artist[];
  currentArtistId: string | undefined;
  page: number;
  pageSize: AdminArtistsPageSize;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: AdminArtistsPageSize) => void;
  onSelectArtist: (artist: Artist) => void;
}

export function LinkWizardTable({
  artists,
  currentArtistId,
  page,
  pageSize,
  onPageChange,
  onPageSizeChange,
  onSelectArtist,
}: LinkWizardTableProps) {
  const from = page * pageSize;
  const pageArtists = artists.slice(from, from + pageSize);

  return (
    <div className="space-y-4">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Missing</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {pageArtists.length === 0 && (
            <TableRow>
              <TableCell
                colSpan={2}
                className="text-center text-muted-foreground"
              >
                No artists missing links for this edition.
              </TableCell>
            </TableRow>
          )}
          {pageArtists.map((artist) => (
            <TableRow
              key={artist.id}
              className={cn(artist.id === currentArtistId && "bg-accent/20")}
            >
              <TableCell>
                <button
                  type="button"
                  onClick={() => onSelectArtist(artist)}
                  className="underline-offset-4 hover:underline text-left"
                >
                  {artist.name}
                </button>
              </TableCell>
              <TableCell className="flex gap-2">
                {!artist.spotify_url && (
                  <Badge variant="outline">Spotify</Badge>
                )}
                {!artist.soundcloud_url && (
                  <Badge variant="outline">SoundCloud</Badge>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <BulkEditorPagination
        page={page}
        pageSize={pageSize}
        totalCount={artists.length}
        onPageChange={onPageChange}
        onPageSizeChange={onPageSizeChange}
      />
    </div>
  );
}
