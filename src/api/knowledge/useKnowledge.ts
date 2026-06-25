import { useAuth } from "@/contexts/AuthContext";
import { useUserKnowledgeQuery } from "./useUserKnowledgeQuery";
import { useKnowledgeToggleMutation } from "./useKnowledgeToggleMutation";

export function useKnowledge() {
  const { user } = useAuth();
  const { data: userKnowledge = {} } = useUserKnowledgeQuery(user?.id);
  const knowledgeToggleMutation = useKnowledgeToggleMutation();

  async function handleKnowledgeToggle(artistId: string) {
    if (!user) {
      return { requiresAuth: true };
    }

    const isKnown = userKnowledge[artistId];

    try {
      await knowledgeToggleMutation.mutateAsync({
        artistId,
        userId: user.id,
        isKnown,
      });
      return { requiresAuth: false };
    } catch (error) {
      console.error("failed toggling knowledge", error);
      return { requiresAuth: false };
    }
  }

  return {
    userKnowledge,
    handleKnowledgeToggle,
  };
}
