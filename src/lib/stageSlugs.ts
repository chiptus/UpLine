import type { Stage } from "@/api/stages/types";

type StageSlugLookup = Pick<Stage, "id" | "slug">;

/**
 * Resolves stage slugs (as they appear in the URL) to stage ids for internal
 * comparison/lookup. Unresolvable slugs (typo, wrong edition, stage removed)
 * are dropped individually rather than failing the whole filter.
 */
export function resolveStageIdsFromSlugs(
  slugs: string[],
  stages: StageSlugLookup[],
): string[] {
  const idBySlug = new Map(stages.map((stage) => [stage.slug, stage.id]));
  return slugs
    .map((slug) => idBySlug.get(slug))
    .filter((id): id is string => id !== undefined);
}

/**
 * Resolves stage ids back to their slugs for writing into the URL.
 * Unresolvable ids are dropped individually.
 */
export function resolveStageSlugsFromIds(
  ids: string[],
  stages: StageSlugLookup[],
): string[] {
  const slugById = new Map(stages.map((stage) => [stage.id, stage.slug]));
  return ids
    .map((id) => slugById.get(id))
    .filter((slug): slug is string => slug !== undefined);
}
