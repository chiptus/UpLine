interface ResolveActiveGroupIdParams {
  profileActiveGroupId: string | null | undefined;
  groupIds: string[];
}

export function resolveActiveGroupId({
  profileActiveGroupId,
  groupIds,
}: ResolveActiveGroupIdParams): string | undefined {
  if (profileActiveGroupId && groupIds.includes(profileActiveGroupId)) {
    return profileActiveGroupId;
  }

  if (groupIds.length === 1) {
    return groupIds[0];
  }

  return undefined;
}
