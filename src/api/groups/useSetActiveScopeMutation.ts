import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { profileKeys } from "@/api/auth/types";

async function setActiveScope(variables: {
  userId: string;
  scope: "group" | "everyone" | "me";
}) {
  const { userId, scope } = variables;

  const { error } = await supabase
    .from("profiles")
    .update({ active_scope: scope })
    .eq("id", userId);

  if (error) {
    throw new Error("Failed to update active scope");
  }
}

export function useSetActiveScopeMutation() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: setActiveScope,
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: profileKeys.detail(variables.userId),
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error?.message || "Failed to update active scope",
        variant: "destructive",
      });
    },
  });
}
