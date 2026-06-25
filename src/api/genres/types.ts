export type Genre = {
  id: string;
  name: string;
};

export const genresKeys = {
  all: () => ["genres"] as const,
};
