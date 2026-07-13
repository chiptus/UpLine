export function isGroupCreator(createdBy: string, userId: string): boolean {
  return createdBy === userId;
}
