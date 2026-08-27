import { FestivalSet } from "@/api/sets/types";
import { useUpdateSetMutation } from "@/api/sets/useUpdateSet";
import { useAddArtistsToSetMutation } from "@/api/sets/useAddArtistsToSet";
import { useRemoveArtistsFromSetMutation } from "@/api/sets/useRemoveArtistsFromSet";
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
  const addArtistsToSetMutation = useAddArtistsToSetMutation();
  const removeArtistsFromSetMutation = useRemoveArtistsFromSetMutation();

  const isPending =
    updateSetMutation.isPending ||
    addArtistsToSetMutation.isPending ||
    removeArtistsFromSetMutation.isPending;

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
      if (artistsToRemove.length > 0) {
        await removeArtistsFromSetMutation.mutateAsync({
          setId,
          artistIds: artistsToRemove,
        });
      }
      if (artistsToAdd.length > 0) {
        await addArtistsToSetMutation.mutateAsync({
          setId,
          artistIds: artistsToAdd,
        });
      }
    } catch {
      // The mutation hooks already toast the failure; keep the dialog open
      // so the user can retry the artist sync.
      return;
    }

    onComplete();
  }
}
