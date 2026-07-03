import { queryOptions, useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Profile, profileKeys } from "./types";

async function fetchProfile(userId: string): Promise<Profile> {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();

  if (error) {
    throw new Error("Failed to fetch profile");
  }

  return data;
}

export function profileQuery(userId: string) {
  return queryOptions({
    queryKey: profileKeys.detail(userId),
    queryFn: () => fetchProfile(userId),
  });
}

export function useProfileQuery(userId: string | undefined) {
  return useQuery({
    ...profileQuery(userId!),
    enabled: !!userId,
  });
}
