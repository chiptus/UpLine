export type PinnedScope =
  | { kind: "group"; groupId: string }
  | { kind: "everyone" }
  | { kind: "me" };

interface ResolveActiveGroupIdParams {
  activeGroupId: string | null | undefined;
  groupIds: string[];
}

export function resolveActiveGroupId({
  activeGroupId,
  groupIds,
}: ResolveActiveGroupIdParams): string | undefined {
  if (activeGroupId && groupIds.includes(activeGroupId)) {
    return activeGroupId;
  }

  if (groupIds.length === 1) {
    return groupIds[0];
  }

  return undefined;
}

interface ResolvePinnedScopeParams {
  activeGroupId: string | null | undefined;
  activeScope: "group" | "everyone" | "me" | null | undefined;
  groupIds: string[];
}

export function resolvePinnedScope({
  activeGroupId,
  activeScope,
  groupIds,
}: ResolvePinnedScopeParams): PinnedScope {
  if (activeScope === "everyone") {
    return { kind: "everyone" };
  }

  if (activeScope === "me") {
    return { kind: "me" };
  }

  const resolvedGroupId = resolveActiveGroupId({ activeGroupId, groupIds });

  if (resolvedGroupId) {
    return { kind: "group", groupId: resolvedGroupId };
  }

  return { kind: "everyone" };
}
