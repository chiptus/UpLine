import { useAuth } from "@/contexts/AuthContext";
import { useUserKnowledgeQuery } from "./useUserKnowledgeQuery";
import { useKnowledgeToggleMutation } from "./useKnowledgeToggleMutation";

export function useKnowledge() {
  const { user } = useAuth();
  const { data: userKnowledge = {} } = useUserKnowledgeQuery(user?.id);
  const knowledgeToggleMutation = useKnowledgeToggleMutation();

  function handleKnowledgeToggle(artistId: string) {
    if (!user) {
      return { requiresAuth: true };
    }

    const isKnown = userKnowledge[artistId];

    knowledgeToggleMutation.mutate(
      {
        artistId,
        userId: user.id,
        isKnown,
      },
      {
        onError: (error) => {
          console.error("failed toggling knowledge", error);
        },
      },
    );

    return { requiresAuth: false };
  }

  return {
    userKnowledge,
    handleKnowledgeToggle,
  };
}
