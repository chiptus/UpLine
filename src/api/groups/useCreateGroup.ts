import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { groupsKeys } from "./types";
import { generateSlug } from "@/lib/slug";

type GroupInsert = Database["public"]["Tables"]["groups"]["Insert"];

// Mutation function
async function createGroup(variables: {
  name: string;
  description?: string | undefined;
  userId: string;
}) {
  const { name, description, userId } = variables;

  const groupData: GroupInsert = {
    name,
    slug: generateSlug(name),
    created_by: userId,
  };
  if (description !== undefined) {
    groupData.description = description;
  }

  const { data: group, error } = await supabase
    .from("groups")
    .insert(groupData)
    .select()
    .single();

  if (error) {
    throw new Error(error.message || "Failed to create group");
  }

  // Add creator as first member
  const { error: memberError } = await supabase.from("group_members").insert({
    group_id: group.id,
    user_id: userId,
    role: "creator",
  });

  if (memberError) {
    throw new Error("Group created but failed to add you as member");
  }

  return group;
}

// Hook
export function useCreateGroupMutation() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: createGroup,
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: groupsKeys.user(variables.userId),
      });
      queryClient.invalidateQueries({
        queryKey: groupsKeys.all,
      });
      toast({
        title: "Success",
        description: "Group created successfully",
      });
    },
    onError: (error) => {
      const message = error?.message || "Failed to create group";
      toast({
        title: message.includes("failed to add") ? "Warning" : "Error",
        description: message,
        variant: "destructive",
      });
    },
  });
}
