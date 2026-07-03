import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import type { Database } from "@/integrations/supabase/types";
import { adminQueries } from "./types";

export function useUpdateAdminRoleMutation() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({
      roleId,
      newRole,
    }: {
      roleId: string;
      newRole: Database["public"]["Enums"]["admin_role"];
    }) => {
      const { error } = await supabase
        .from("admin_roles")
        .update({ role: newRole })
        .eq("id", roleId);

      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Admin role updated",
      });
      queryClient.invalidateQueries({ queryKey: adminQueries.roles() });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update admin role",
        variant: "destructive",
      });
    },
  });
}
