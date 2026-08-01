interface ResolveActiveGroupIdParams {
  profileActiveGroupId: string | null | undefined;
  hasExplicitSelection: boolean;
  groupIds: string[];
}

export function resolveActiveGroupId({
  profileActiveGroupId,
  hasExplicitSelection,
  groupIds,
}: ResolveActiveGroupIdParams): string | undefined {
  if (profileActiveGroupId && groupIds.includes(profileActiveGroupId)) {
    return profileActiveGroupId;
  }

  if (profileActiveGroupId === null && hasExplicitSelection) {
    return undefined;
  }

  if (groupIds.length === 1) {
    return groupIds[0];
  }

  return undefined;
}
