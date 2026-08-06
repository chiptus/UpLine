import { queryOptions, useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
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
