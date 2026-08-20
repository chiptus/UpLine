import { TEST_CONFIG } from "../config/test-env";

const ADMIN_HEADERS = {
  "Content-Type": "application/json",
  apikey: TEST_CONFIG.SUPABASE_SERVICE_ROLE_KEY,
  Authorization: `Bearer ${TEST_CONFIG.SUPABASE_SERVICE_ROLE_KEY}`,
};

async function getUserIdByEmail(email: string): Promise<string> {
  const response = await fetch(
    `${TEST_CONFIG.SUPABASE_URL}/rest/v1/profiles?email=eq.${encodeURIComponent(email)}&select=id`,
    { headers: ADMIN_HEADERS },
  );

  if (!response.ok) {
    throw new Error(
      `Failed to look up profile for ${email}: ${response.status}`,
    );
  }

  const [profile] = (await response.json()) as { id: string }[];

  if (!profile) {
    throw new Error(`No profile found for ${email}`);
  }

  return profile.id;
}

// Creates a group and adds the given user as its sole member, so
// single-group auto-activation kicks in for them.
export async function createGroupWithMember(
  email: string,
  groupName = `Test Group ${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
): Promise<{ groupId: string; groupName: string }> {
  const userId = await getUserIdByEmail(email);

  const groupResponse = await fetch(
    `${TEST_CONFIG.SUPABASE_URL}/rest/v1/groups`,
    {
      method: "POST",
      headers: { ...ADMIN_HEADERS, Prefer: "return=representation" },
      body: JSON.stringify({
        name: groupName,
        slug: groupName.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
        created_by: userId,
      }),
    },
  );

  if (!groupResponse.ok) {
    throw new Error(`Failed to create test group: ${groupResponse.status}`);
  }

  const [group] = (await groupResponse.json()) as { id: string }[];

  const memberResponse = await fetch(
    `${TEST_CONFIG.SUPABASE_URL}/rest/v1/group_members`,
    {
      method: "POST",
      headers: { ...ADMIN_HEADERS, Prefer: "return=minimal" },
      body: JSON.stringify({ group_id: group.id, user_id: userId }),
    },
  );

  if (!memberResponse.ok) {
    throw new Error(
      `Failed to add test group member: ${memberResponse.status}`,
    );
  }

  return { groupId: group.id, groupName };
}

// Adds an existing group's membership for another user.
export async function addMemberToGroup(
  groupId: string,
  email: string,
): Promise<void> {
  const userId = await getUserIdByEmail(email);

  const memberResponse = await fetch(
    `${TEST_CONFIG.SUPABASE_URL}/rest/v1/group_members`,
    {
      method: "POST",
      headers: { ...ADMIN_HEADERS, Prefer: "return=minimal" },
      body: JSON.stringify({ group_id: groupId, user_id: userId }),
    },
  );

  if (!memberResponse.ok) {
    throw new Error(
      `Failed to add test group member: ${memberResponse.status}`,
    );
  }
}
