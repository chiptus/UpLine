import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { profileKeys } from "@/api/auth/types";
import type { Database } from "@/integrations/supabase/types";

type ProfileUpdate = Database["public"]["Tables"]["profiles"]["Update"];

export function useProfileFieldMutation<K extends keyof ProfileUpdate>({
  column,
  errorMessage,
}: {
  column: K;
  errorMessage: string;
}) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (variables: {
      userId: string;
      value: ProfileUpdate[K];
    }) => {
      const { error } = await supabase
        .from("profiles")
        .update({ [column]: variables.value } as ProfileUpdate)
        .eq("id", variables.userId);

      if (error) {
        throw new Error(errorMessage);
      }
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: profileKeys.detail(variables.userId),
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error?.message || errorMessage,
        variant: "destructive",
      });
    },
  });
}
