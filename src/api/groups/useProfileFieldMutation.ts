import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Profile, profileKeys } from "@/api/auth/types";
import type { Database } from "@/integrations/supabase/types";

type ProfileUpdate = Database["public"]["Tables"]["profiles"]["Update"];
type ProfileFieldColumn = "active_group_id" | "active_scope" | "use_24_hour";

export function useProfileFieldMutation() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (variables: {
      userId: string;
      column: ProfileFieldColumn;
      value: ProfileUpdate[ProfileFieldColumn];
      errorMessage: string;
    }) => {
      const { error } = await supabase
        .from("profiles")
        .update({ [variables.column]: variables.value } as ProfileUpdate)
        .eq("id", variables.userId);

      if (error) {
        throw new Error(variables.errorMessage);
      }
    },
    onMutate: async (variables) => {
      const queryKey = profileKeys.detail(variables.userId);
      await queryClient.cancelQueries({ queryKey });

      const previousProfile = queryClient.getQueryData<Profile>(queryKey);
      if (previousProfile) {
        queryClient.setQueryData<Profile>(queryKey, {
          ...previousProfile,
          [variables.column]: variables.value,
        });
      }

      return { previousProfile };
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: profileKeys.detail(variables.userId),
      });
    },
    onError: (error, variables, context) => {
      if (context?.previousProfile) {
        queryClient.setQueryData(
          profileKeys.detail(variables.userId),
          context.previousProfile,
        );
      }
      toast({
        title: "Error",
        description: error?.message || variables.errorMessage,
        variant: "destructive",
      });
    },
  });
}
