import { registerCleanup, testSupabase } from "../harness";

/** Disposable group, created by `createdBy`. Self-cleans (cascades to its members). */
export async function createGroup(createdBy: string): Promise<string> {
  const suffix = crypto.randomUUID();

  const { data: group, error } = await testSupabase
    .from("groups")
    .insert({
      name: `Scratch Group ${suffix}`,
      slug: `scratch-group-${suffix}`,
      created_by: createdBy,
    })
    .select("id")
    .single();
  if (error) throw error;

  registerCleanup(async () => {
    const { error: deleteError } = await testSupabase
      .from("groups")
      .delete()
      .eq("id", group.id);
    if (deleteError) throw deleteError;
  });

  return group.id;
}

/** Adds `userId` as a member of `groupId`. Self-cleans. */
export async function addGroupMember(
  groupId: string,
  userId: string,
): Promise<void> {
  const { error } = await testSupabase
    .from("group_members")
    .insert({ group_id: groupId, user_id: userId });
  if (error) throw error;

  registerCleanup(async () => {
    const { error: deleteError } = await testSupabase
      .from("group_members")
      .delete()
      .eq("group_id", groupId)
      .eq("user_id", userId);
    if (deleteError) throw deleteError;
  });
}
