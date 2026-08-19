import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { userVotesKeys } from "./types";
import { setsKeys } from "@/api/sets/types";

export async function vote(variables: {
  setId: string;
  voteType: number;
  userId: string;
  existingVote?: number | undefined;
}) {
  const { setId, voteType, userId, existingVote } = variables;

  // Prioritize set voting over artist voting
  const targetField = "set_id";

  if (existingVote === voteType) {
    // Remove vote if clicking the same vote type
    const { error } = await supabase
      .from("votes")
      .delete()
      .eq("user_id", userId)
      .eq(targetField, setId);

    if (error) throw new Error("Failed to remove vote");
    return null;
  } else {
    // Add or update vote
    const voteData: {
      set_id: string;
      updated_at?: string;
      user_id: string;
      vote_type: number;
    } = {
      user_id: userId,
      vote_type: voteType,
      set_id: setId,
    };

    const { error } = await supabase.from("votes").upsert(voteData, {
      onConflict: "user_id,set_id",
    });

    if (error) throw new Error("Failed to save vote");
    return voteType;
  }
}

export function useVoteMutation() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: vote,
    onMutate: async (variables) => {
      const { setId, voteType, userId, existingVote } = variables;

      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: userVotesKeys.user(userId) });

      // Snapshot the previous value
      const previousVotes = queryClient.getQueryData<Record<string, number>>(
        userVotesKeys.user(userId),
      );

      // Optimistically update to the new value
      queryClient.setQueryData<Record<string, number>>(
        userVotesKeys.user(userId),
        (old) => {
          if (!old) return {};
          const newVotes = { ...old };

          if (existingVote === voteType) {
            // Remove vote
            delete newVotes[setId];
          } else {
            // Add/update vote
            newVotes[setId] = voteType;
          }

          return newVotes;
        },
      );

      return { previousVotes, userId };
    },
    onError: (_error, _variables, context) => {
      // If the mutation fails, use the context returned from onMutate to roll back
      if (context?.previousVotes) {
        queryClient.setQueryData(
          userVotesKeys.user(context.userId),
          context.previousVotes,
        );
      }

      toast({
        title: "Error",
        description: "Failed to save vote. Please try again.",
        variant: "destructive",
      });
    },
    onSettled: (_data, _error, variables) => {
      // Always refetch after error or success to ensure consistency
      queryClient.invalidateQueries({
        queryKey: userVotesKeys.user(variables.userId),
      });
      queryClient.invalidateQueries({ queryKey: setsKeys.all });
      queryClient.invalidateQueries({
        queryKey: setsKeys.detail(variables.setId),
      });
    },
  });
}
