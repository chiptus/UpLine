/**
 * Single TypeScript definition of set types: src/api/sets/types.ts re-exports
 * it, so this file must stay dependency-free (Deno can't resolve `@/` aliases).
 */
export const SET_TYPES = ["music", "workshop", "performance", "other"] as const;

export type SetType = (typeof SET_TYPES)[number];

export function asSetType(value: string | null): SetType | null {
  return SET_TYPES.includes(value as SetType) ? (value as SetType) : null;
}
