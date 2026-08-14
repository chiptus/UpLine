import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { profileKeys } from "@/api/auth/types";
import type { Database } from "@/integrations/supabase/types";

type ProfileUpdate = Database["public"]["Tables"]["profiles"]["Update"];
type ScopeColumn = "active_group_id" | "active_scope";

export function useProfileFieldMutation() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (variables: {
      userId: string;
      column: ScopeColumn;
      value: ProfileUpdate[ScopeColumn];
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
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: profileKeys.detail(variables.userId),
      });
    },
    onError: (error, variables) => {
      toast({
        title: "Error",
        description: error?.message || variables.errorMessage,
        variant: "destructive",
      });
    },
  });
}
