import { queryOptions, useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { knowledgeKeys } from "./types";

async function fetchUserKnowledge(
  userId: string,
): Promise<Record<string, boolean>> {
  const { data, error } = await supabase
    .from("artist_knowledge")
    .select("artist_id")
    .eq("user_id", userId);

  if (error) {
    throw new Error("Failed to fetch user knowledge");
  }

  return (data || []).reduce(
    (acc, knowledge) => {
      acc[knowledge.artist_id] = true;
      return acc;
    },
    {} as Record<string, boolean>,
  );
}

export function userKnowledgeQuery(userId: string) {
  return queryOptions({
    queryKey: knowledgeKeys.user(userId),
    queryFn: () => fetchUserKnowledge(userId),
  });
}

export function useUserKnowledgeQuery(userId: string | undefined) {
  return useQuery({
    ...userKnowledgeQuery(userId!),
    enabled: !!userId,
  });
}
