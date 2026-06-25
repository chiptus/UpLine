import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { knowledgeKeys } from "./types";

async function toggleKnowledge(variables: {
  artistId: string;
  userId: string;
  isKnown: boolean;
}) {
  const { artistId, userId, isKnown } = variables;

  if (isKnown) {
    const { error } = await supabase
      .from("artist_knowledge")
      .delete()
      .eq("user_id", userId)
      .eq("artist_id", artistId);

    if (error) throw new Error("Failed to remove knowledge");
    return false;
  } else {
    const { error } = await supabase.from("artist_knowledge").insert({
      user_id: userId,
      artist_id: artistId,
    });

    if (error) throw new Error("Failed to add knowledge");
    return true;
  }
}

export function useKnowledgeToggleMutation() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: toggleKnowledge,
    onMutate: async (variables) => {
      const { artistId, userId, isKnown } = variables;

      await queryClient.cancelQueries({
        queryKey: knowledgeKeys.user(userId),
      });

      const previousKnowledge = queryClient.getQueryData<
        Record<string, boolean>
      >(knowledgeKeys.user(userId));

      queryClient.setQueryData<Record<string, boolean>>(
        knowledgeKeys.user(userId),
        (old) => {
          if (!old) return {};
          const newKnowledge = { ...old };

          if (isKnown) {
            delete newKnowledge[artistId];
          } else {
            newKnowledge[artistId] = true;
          }

          return newKnowledge;
        },
      );

      return { previousKnowledge, userId };
    },
    onError: (_error, _variables, context) => {
      if (context?.previousKnowledge) {
        queryClient.setQueryData(
          knowledgeKeys.user(context.userId),
          context.previousKnowledge,
        );
      }

      toast({
        title: "Error",
        description: "Failed to update knowledge. Please try again.",
        variant: "destructive",
      });
    },
    onSettled: (_data, _error, variables) => {
      queryClient.invalidateQueries({
        queryKey: knowledgeKeys.user(variables.userId),
      });
    },
  });
}
