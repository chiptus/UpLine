import { useCreateSetMutation } from "@/api/sets/useCreateSet";
import { useAddArtistsToSetMutation } from "@/api/sets/useAddArtistsToSet";
import { SetFormData } from "./setFormSchema";
import { toSetPayload } from "./toSetPayload";

interface UseCreateSetSubmitOptions {
  editionId: string;
  timezone: string;
  userId: string | undefined;
  onComplete: () => void;
}

export function useCreateSetSubmit({
  editionId,
  timezone,
  userId,
  onComplete,
}: UseCreateSetSubmitOptions) {
  const createSetMutation = useCreateSetMutation();
  const addArtistsToSetMutation = useAddArtistsToSetMutation();

  const isPending =
    createSetMutation.isPending || addArtistsToSetMutation.isPending;

  return { submit, isPending };

  function submit(data: SetFormData) {
    if (!userId) {
      return;
    }

    createSetMutation.mutate(
      { ...toSetPayload(data, editionId, timezone), created_by: userId },
      {
        onSuccess: (newSet) => addArtists(data, newSet.id),
      },
    );
  }

  function addArtists(data: SetFormData, setId: string) {
    const artistIds = data.artist_ids || [];
    if (artistIds.length === 0) {
      onComplete();
      return;
    }

    // On failure the mutation hook toasts; keep the dialog open for retry.
    addArtistsToSetMutation.mutate(
      { setId, artistIds },
      { onSuccess: onComplete },
    );
  }
}
