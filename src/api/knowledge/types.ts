export const knowledgeKeys = {
  all: ["knowledge"] as const,
  user: (userId: string) => [...knowledgeKeys.all, "user", userId] as const,
};
