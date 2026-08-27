import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { artistsKeys } from "@/api/artists/types";
import { updateSet } from "./useUpdateSet";
import { SetType, setsKeys } from "./types";

export interface SetTypeBackfill {
  id: string;
  set_type: SetType;
}

async function backfillSetTypes(variables: { updates: SetTypeBackfill[] }) {
  return Promise.all(
    variables.updates.map((update) =>
      updateSet({ id: update.id, updates: { set_type: update.set_type } }),
    ),
  );
}

export function useBackfillSetTypesMutation() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: backfillSetTypes,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: setsKeys.all });
      // The link-wizard queue query lives under the artists key factory even
      // though it reads from sets, so it must be invalidated here too.
      queryClient.invalidateQueries({ queryKey: artistsKeys.lists() });
      toast({
        title: "Success",
        description:
          data.length === 1
            ? "Set type saved"
            : `${data.length} set types saved`,
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error?.message || "Failed to save set types",
        variant: "destructive",
      });
    },
  });
}
