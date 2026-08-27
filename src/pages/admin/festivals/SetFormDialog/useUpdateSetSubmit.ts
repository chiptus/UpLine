import { FestivalSet } from "@/api/sets/types";
import { useUpdateSetMutation } from "@/api/sets/useUpdateSet";
import { useAddArtistToSetMutation } from "@/api/sets/useAddArtistToSet";
import { useRemoveArtistFromSetMutation } from "@/api/sets/useRemoveArtistFromSet";
import { SetFormData } from "./setFormSchema";
import { toSetPayload } from "./toSetPayload";

interface UseUpdateSetSubmitOptions {
  set: FestivalSet;
  editionId: string;
  timezone: string;
  onComplete: () => void;
}

export function useUpdateSetSubmit({
  set,
  editionId,
  timezone,
  onComplete,
}: UseUpdateSetSubmitOptions) {
  const updateSetMutation = useUpdateSetMutation();
  const addArtistToSetMutation = useAddArtistToSetMutation();
  const removeArtistFromSetMutation = useRemoveArtistFromSetMutation();

  const isPending =
    updateSetMutation.isPending ||
    addArtistToSetMutation.isPending ||
    removeArtistFromSetMutation.isPending;

  return { submit, isPending };

  function submit(data: SetFormData) {
    updateSetMutation.mutate(
      { id: set.id, updates: toSetPayload(data, editionId, timezone) },
      {
        onSuccess: (updatedSet) => syncArtistsAndComplete(data, updatedSet.id),
      },
    );
  }

  async function syncArtistsAndComplete(data: SetFormData, setId: string) {
    const selectedArtistIds = data.artist_ids || [];
    const existingArtistIds = set.artists?.map((a) => a.id) || [];

    const artistsToRemove = existingArtistIds.filter(
      (id) => !selectedArtistIds.includes(id),
    );
    const artistsToAdd = selectedArtistIds.filter(
      (id) => !existingArtistIds.includes(id),
    );

    try {
      for (const artistId of artistsToRemove) {
        await removeArtistFromSetMutation.mutateAsync({ setId, artistId });
      }
      for (const artistId of artistsToAdd) {
        await addArtistToSetMutation.mutateAsync({ setId, artistId });
      }
    } catch {
      // The mutation hooks already toast the failure; keep the dialog open
      // so the user can retry the artist sync.
      return;
    }

    onComplete();
  }
}
