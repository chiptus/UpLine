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
}

export function useSetFormSubmit({
  editingSet,
  editionId,
  timezone,
  userId,
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

  async function submit(data: SetFormData) {
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

    let setId: string;
    if (editingSet) {
      const updatedSet = await updateSetMutation.mutateAsync({
        id: editingSet.id,
        updates: submitData,
      });
      setId = updatedSet.id;
    } else {
      const newSet = await createSetMutation.mutateAsync({
        ...submitData,
        created_by: userId,
      });
      setId = newSet.id;
    }

    const selectedArtistIds = data.artist_ids || [];
    const existingArtistIds = editingSet?.artists?.map((a) => a.id) || [];

    const artistsToRemove = existingArtistIds.filter(
      (id) => !selectedArtistIds.includes(id),
    );
    for (const artistId of artistsToRemove) {
      await removeArtistFromSetMutation.mutateAsync({
        setId: editingSet!.id,
        artistId,
      });
    }

    const artistsToAdd = selectedArtistIds.filter(
      (id) => !existingArtistIds.includes(id),
    );
    for (const artistId of artistsToAdd) {
      await addArtistToSetMutation.mutateAsync({ setId, artistId });
    }
  }
}
