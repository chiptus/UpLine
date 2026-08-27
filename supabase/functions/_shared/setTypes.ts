// Mirrors SET_TYPES in src/api/sets/types.ts and the sets_set_type_check
// constraint. Keep the three in sync when adding a type.
export const SET_TYPES = ["music", "workshop", "performance", "other"] as const;

export type SetType = (typeof SET_TYPES)[number];
