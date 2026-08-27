import { useCreateSetMutation } from "@/api/sets/useCreateSet";
import { useAddArtistToSetMutation } from "@/api/sets/useAddArtistToSet";
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
  const addArtistToSetMutation = useAddArtistToSetMutation();

  const isPending =
    createSetMutation.isPending || addArtistToSetMutation.isPending;

  return { submit, isPending };

  function submit(data: SetFormData) {
    if (!userId) {
      return;
    }

    createSetMutation.mutate(
      { ...toSetPayload(data, editionId, timezone), created_by: userId },
      {
        onSuccess: (newSet) => addArtistsAndComplete(data, newSet.id),
      },
    );
  }

  async function addArtistsAndComplete(data: SetFormData, setId: string) {
    try {
      for (const artistId of data.artist_ids || []) {
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
