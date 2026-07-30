import { queryOptions, useQuery, useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import type { InviteValidation } from "@/types/invites";
import { inviteValidationKeys } from "./types";

async function validateInviteToken(
  token: string,
): Promise<InviteValidation | null> {
  const { data, error } = await supabase.rpc("validate_invite_token", {
    token,
  });

  if (error) {
    console.error("Error validating invite:", error);
    throw new Error(error.message);
  }

  if (data && data.length > 0) {
    return data[0] as InviteValidation;
  }

  return null;
}

export function inviteValidationQuery(token: string) {
  return queryOptions({
    queryKey: inviteValidationKeys.byToken(token),
    queryFn: () => validateInviteToken(token),
    staleTime: 0, // Always fresh check for invites
    gcTime: 0, // Don't cache invite validations
    retry: false, // Don't retry failed validations
  });
}

export function useInviteValidationQuery(token: string | null) {
  return useQuery({
    ...inviteValidationQuery(token!),
    enabled: !!token,
  });
}

export function useInviteMutation() {
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({
      token,
      userId,
    }: {
      token: string;
      userId: string;
    }) => {
      const { data, error } = await supabase.rpc("use_invite_token", {
        token,
        user_id: userId,
      });

      if (error) {
        console.error("Error using invite:", error);
        throw new Error("Failed to join group");
      }

      if (data && data.length > 0) {
        const result = data[0];
        if (result.success) {
          return result;
        } else {
          throw new Error(result.message);
        }
      }

      throw new Error("Failed to join group");
    },
    onSuccess: () => {
      // We'll need to get the group name from somewhere - let's make this flexible
      toast({
        title: "Success",
        description: "Successfully joined the group!",
      });
      return true;
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
      return false;
    },
  });
}
