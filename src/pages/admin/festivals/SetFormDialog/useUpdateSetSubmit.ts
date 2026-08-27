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

  // On failure the mutation hooks toast and onComplete is never reached,
  // keeping the dialog open so the user can retry the artist sync.
  function syncArtistsAndComplete(data: SetFormData, setId: string) {
    const selectedArtistIds = data.artist_ids || [];
    const existingArtistIds = set.artists?.map((a) => a.id) || [];

    const artistsToRemove = existingArtistIds.filter(
      (id) => !selectedArtistIds.includes(id),
    );
    const artistsToAdd = selectedArtistIds.filter(
      (id) => !existingArtistIds.includes(id),
    );

    removeArtists();

    function removeArtists() {
      if (artistsToRemove.length === 0) {
        addArtists();
        return;
      }
      removeArtistsFromSetMutation.mutate(
        { setId, artistIds: artistsToRemove },
        { onSuccess: addArtists },
      );
    }

    function addArtists() {
      if (artistsToAdd.length === 0) {
        onComplete();
        return;
      }
      addArtistsToSetMutation.mutate(
        { setId, artistIds: artistsToAdd },
        { onSuccess: onComplete },
      );
    }
  }
}
