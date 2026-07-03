import {
  queryOptions,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import type { Database } from "@/integrations/supabase/types";
import { adminQueries, type AdminRoleRow } from "./types";

export type AdminRole = AdminRoleRow & {
  profile?: {
    username: string | null;
    email: string | null;
  };
};

// Query Functions
async function fetchAdminRoles(): Promise<AdminRole[]> {
  const { data: roles, error } = await supabase
    .from("admin_roles")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw error;

  if (roles) {
    // Fetch profile information for each admin
    const rolesWithProfiles = await Promise.all(
      roles.map(async (role) => {
        const { data: profile } = await supabase
          .from("profiles")
          .select("username, email")
          .eq("id", role.user_id)
          .single();

        return {
          ...role,
          profile: profile || { username: null, email: null },
        };
      }),
    );

    return rolesWithProfiles;
  }

  return [];
}

export function adminRolesQuery() {
  return queryOptions({
    queryKey: adminQueries.roles(),
    queryFn: fetchAdminRoles,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
}

// Hooks
export function useAdminRolesQuery() {
  return useQuery(adminRolesQuery());
}

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
