import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { adminQueries } from "./types";

export function useRemoveAdminMutation() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (roleId: string) => {
      const { error } = await supabase
        .from("admin_roles")
        .delete()
        .eq("id", roleId);

      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Admin role removed",
      });
      queryClient.invalidateQueries({ queryKey: adminQueries.roles() });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to remove admin role",
        variant: "destructive",
      });
    },
  });
}
