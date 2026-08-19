import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { profileKeys } from "./types";

// Mutation function
async function updateProfile(variables: {
  userId: string;
  updates: { username?: string | null; completed_onboarding?: boolean | null };
}) {
  const { userId, updates } = variables;

  // Validate username uniqueness before attempting update
  const trimmedUsername = updates.username?.trim();
  const rpcArgs: {
    user_id: string;
    new_username?: string;
  } = { user_id: userId };
  if (trimmedUsername !== undefined) {
    rpcArgs.new_username = trimmedUsername;
  }
  const { data: validationResult, error: validationError } = await supabase.rpc(
    "validate_profile_update",
    rpcArgs,
  );

  if (validationError) {
    throw new Error("Failed to validate profile data");
  }

  if (validationResult) {
    throw new Error(validationResult);
  }

  const { data, error } = await supabase
    .from("profiles")
    .update(updates)
    .eq("id", userId)
    .select()
    .single();

  if (error) {
    throw new Error("Failed to update profile");
  }

  return data;
}

// Hook
export function useUpdateProfileMutation() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: updateProfile,
    onSuccess: async (_data, variables) => {
      // Invalidate to ensure consistency
      queryClient.invalidateQueries({
        queryKey: profileKeys.detail(variables.userId),
      });

      toast({
        title: "Success",
        description: "Profile updated successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error?.message || "Failed to update profile",
        variant: "destructive",
      });
    },
  });
}
