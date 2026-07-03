import { artistsKeys } from "@/api/artists/types";

export type SetNote = {
  id: string;
  set_id: string;
  user_id: string;
  note_content: string;
  created_at: string;
  updated_at: string;
  author_username?: string;
  author_email?: string;
};

// Query key factory
export const artistNotesKeys = {
  notes: (artistId: string) =>
    [...artistsKeys.detail(artistId), "notes"] as const,
};
