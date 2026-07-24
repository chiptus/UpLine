import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { userRatingsKeys } from "./types";

async function rateSet(variables: {
  setId: string;
  rating: number;
  userId: string;
  existingRating?: number;
}) {
  const { setId, rating, userId, existingRating } = variables;

  if (existingRating === rating) {
    const { error } = await supabase
      .from("set_ratings")
      .delete()
      .eq("user_id", userId)
      .eq("set_id", setId);

    if (error) throw new Error("Failed to remove rating");
    return null;
  }

  const { error } = await supabase.from("set_ratings").upsert(
    {
      user_id: userId,
      set_id: setId,
      rating,
    },
    { onConflict: "user_id,set_id" },
  );

  if (error) throw new Error("Failed to save rating");
  return rating;
}

export function useRateSet() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: rateSet,
    onMutate: async (variables) => {
      const { setId, rating, userId, existingRating } = variables;

      await queryClient.cancelQueries({
        queryKey: userRatingsKeys.user(userId),
      });

      const previousRatings = queryClient.getQueryData<Record<string, number>>(
        userRatingsKeys.user(userId),
      );

      queryClient.setQueryData<Record<string, number>>(
        userRatingsKeys.user(userId),
        (old) => {
          const newRatings = { ...old };

          if (existingRating === rating) {
            delete newRatings[setId];
          } else {
            newRatings[setId] = rating;
          }

          return newRatings;
        },
      );

      return { previousRatings, userId };
    },
    onError: (_error, _variables, context) => {
      if (context?.previousRatings) {
        queryClient.setQueryData(
          userRatingsKeys.user(context.userId),
          context.previousRatings,
        );
      }

      toast({
        title: "Error",
        description: "Failed to save rating. Please try again.",
        variant: "destructive",
      });
    },
    onSettled: (_data, _error, variables) => {
      queryClient.invalidateQueries({
        queryKey: userRatingsKeys.user(variables.userId),
      });
    },
  });
}
