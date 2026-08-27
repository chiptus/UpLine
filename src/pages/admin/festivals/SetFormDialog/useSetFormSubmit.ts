import { FestivalSet } from "@/api/sets/types";
import { useCreateSetMutation } from "@/api/sets/useCreateSet";
import { useUpdateSetMutation } from "@/api/sets/useUpdateSet";
import { useAddArtistToSetMutation } from "@/api/sets/useAddArtistToSet";
import { useRemoveArtistFromSetMutation } from "@/api/sets/useRemoveArtistFromSet";
import { convertLocalTimeToUTC } from "@/lib/timeUtils";
import { SetFormData } from "./setFormSchema";

interface UseSetFormSubmitOptions {
  editingSet: FestivalSet | null;
  editionId: string;
  timezone: string;
  userId: string | undefined;
  onComplete: () => void;
}

export function useSetFormSubmit({
  editingSet,
  editionId,
  timezone,
  userId,
  onComplete,
}: UseSetFormSubmitOptions) {
  const createSetMutation = useCreateSetMutation();
  const updateSetMutation = useUpdateSetMutation();
  const addArtistToSetMutation = useAddArtistToSetMutation();
  const removeArtistFromSetMutation = useRemoveArtistFromSetMutation();

  const isPending =
    createSetMutation.isPending ||
    updateSetMutation.isPending ||
    addArtistToSetMutation.isPending ||
    removeArtistFromSetMutation.isPending;

  return { submit, isPending };

  function submit(data: SetFormData) {
    if (!userId) {
      return;
    }

    const submitData = {
      name: data.name,
      description: data.description || null,
      festival_edition_id: editionId,
      stage_id:
        data.stage_id && data.stage_id !== "none" ? data.stage_id : null,
      time_start: data.time_start
        ? convertLocalTimeToUTC(data.time_start, timezone)
        : null,
      time_end: data.time_end
        ? convertLocalTimeToUTC(data.time_end, timezone)
        : null,
    };

    if (editingSet) {
      updateSetMutation.mutate(
        { id: editingSet.id, updates: submitData },
        {
          onSuccess: (updatedSet) =>
            syncArtistsAndComplete(data, updatedSet.id),
        },
      );
    } else {
      createSetMutation.mutate(
        { ...submitData, created_by: userId },
        {
          onSuccess: (newSet) => syncArtistsAndComplete(data, newSet.id),
        },
      );
    }
  }

  async function syncArtistsAndComplete(data: SetFormData, setId: string) {
    const selectedArtistIds = data.artist_ids || [];
    const existingArtistIds = editingSet?.artists?.map((a) => a.id) || [];

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
