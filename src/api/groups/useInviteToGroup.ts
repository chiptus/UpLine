import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { groupsKeys } from "./types";

// Helper functions
async function findUserByUsernameOrEmail(usernameOrEmail: string) {
  // First, try to find the user by username or email in profiles
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id")
    .or(`username.ilike.${usernameOrEmail},email.ilike.${usernameOrEmail}`)
    .single();

  // If not found in profiles, check auth.users by email
  if (profileError || !profile) {
    // Check if it's an email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (emailRegex.test(usernameOrEmail)) {
      // Try to find by email in auth system
      const { data: authData, error: authError } = await supabase.rpc(
        "get_user_id_by_email",
        { user_email: usernameOrEmail },
      );

      if (authError || !authData) {
        return { found: false, userId: null, foundBy: "email" as const };
      }

      return { found: true, userId: authData, foundBy: "email" as const };
    } else {
      return { found: false, userId: null, foundBy: "username" as const };
    }
  }

  return { found: true, userId: profile.id, foundBy: "profile" as const };
}

async function checkIfUserInGroup(
  groupId: string,
  userId: string,
): Promise<boolean> {
  const { data: existingMember } = await supabase
    .from("group_members")
    .select("id")
    .eq("group_id", groupId)
    .eq("user_id", userId)
    .limit(1);

  return !!(existingMember && existingMember.length);
}

async function addUserToGroup(groupId: string, userId: string): Promise<void> {
  const { error } = await supabase.from("group_members").insert({
    group_id: groupId,
    user_id: userId,
  });

  if (error) {
    throw new Error("Failed to invite user to group");
  }
}

// Mutation function
async function inviteToGroup(variables: {
  groupId: string;
  usernameOrEmail: string;
}) {
  const { groupId, usernameOrEmail } = variables;

  // Find user by username or email
  const userResult = await findUserByUsernameOrEmail(usernameOrEmail);

  if (!userResult.found) {
    const errorMessage =
      userResult.foundBy === "email"
        ? `No user found with email: ${usernameOrEmail}`
        : "User not found";
    throw new Error(errorMessage);
  }

  // Check if user is already in the group
  const isAlreadyMember = await checkIfUserInGroup(groupId, userResult.userId!);
  if (isAlreadyMember) {
    throw new Error("User is already in this group");
  }

  // Add user to group
  await addUserToGroup(groupId, userResult.userId!);

  return {
    usernameOrEmail,
    foundBy: userResult.foundBy,
    userId: userResult.userId!,
  };
}

// Hook
export function useInviteToGroupMutation(groupId: string) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (usernameOrEmail: string) =>
      inviteToGroup({ groupId, usernameOrEmail }),
    onSuccess: (data) => {
      // Invalidate group members query to refresh the list
      queryClient.invalidateQueries({
        queryKey: groupsKeys.members(groupId),
      });

      toast({
        title: "Member Added",
        description: `${data.usernameOrEmail} has been added to the group`,
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "Failed to invite user to group",
        variant: "destructive",
      });
    },
  });
}
