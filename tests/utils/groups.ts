import { adminClient } from "./supabaseAdmin";

// Creates a group and adds the given user as its sole member, so
// single-group auto-activation kicks in for them.
export async function createGroupWithMember(
  email: string,
  groupName = `Test Group ${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
): Promise<{ groupId: string; groupName: string }> {
  const userId = await getUserIdByEmail(email);

  const { data: group, error: groupError } = await adminClient
    .from("groups")
    .insert({
      name: groupName,
      slug: groupName.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
      created_by: userId,
    })
    .select("id")
    .single();

  if (groupError) {
    throw new Error(`Failed to create test group: ${groupError.message}`);
  }

  await addMemberToGroup(group.id, email);

  return { groupId: group.id, groupName };
}

// Adds an existing group's membership for another user.
export async function addMemberToGroup(
  groupId: string,
  email: string,
): Promise<void> {
  const userId = await getUserIdByEmail(email);

  const { error } = await adminClient
    .from("group_members")
    .insert({ group_id: groupId, user_id: userId });

  if (error) {
    throw new Error(`Failed to add test group member: ${error.message}`);
  }
}

async function getUserIdByEmail(email: string): Promise<string> {
  const { data: profile, error } = await adminClient
    .from("profiles")
    .select("id")
    .eq("email", email)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to look up profile for ${email}: ${error.message}`);
  }

  if (!profile) {
    throw new Error(`No profile found for ${email}`);
  }

  return profile.id;
}
