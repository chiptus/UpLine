import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import type { Database } from "@/integrations/supabase/types";
import { adminQueries } from "./types";

export function useAddAdminMutation() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({
      email,
      role,
    }: {
      email: string;
      role: Database["public"]["Enums"]["admin_role"];
    }) => {
      // First, get the user ID by email
      const { data: userId, error: userError } = await supabase.rpc(
        "get_user_id_by_email",
        { user_email: email },
      );

      if (userError || !userId) {
        throw new Error("No user found with this email address");
      }

      // Check if user already has an admin role
      const { data: existingRole } = await supabase
        .from("admin_roles")
        .select("*")
        .eq("user_id", userId)
        .single();

      if (existingRole) {
        throw new Error(`This user already has the ${existingRole.role} role`);
      }

      // Get current user
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user?.id) {
        throw new Error("User not found");
      }

      // Add the admin role
      const { error: insertError } = await supabase.from("admin_roles").insert({
        user_id: userId,
        role: role,
        created_by: user.id,
      });

      if (insertError) throw insertError;

      return { userId, role };
    },
    onSuccess: (data) => {
      toast({
        title: "Success",
        description: `User added as ${data.role}`,
      });
      queryClient.invalidateQueries({ queryKey: adminQueries.roles() });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}
