import { Page } from "@playwright/test";
import { TEST_CONFIG } from "../config/test-env";
import { signIn } from "./login";

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

async function grantAdminRole(userId: string): Promise<void> {
  const response = await fetch(
    `${TEST_CONFIG.SUPABASE_URL}/rest/v1/admin_roles`,
    {
      method: "POST",
      headers: { ...ADMIN_HEADERS, Prefer: "return=minimal" },
      body: JSON.stringify({
        user_id: userId,
        role: "admin",
        created_by: userId,
      }),
    },
  );

  if (!response.ok) {
    throw new Error(`Failed to grant admin role: ${response.status}`);
  }
}

// Signs in a fresh user and grants it the "admin" role, so admin/festival
// management pages become reachable in tests.
export async function signInAsAdmin(page: Page) {
  const email = await signIn(page);
  const userId = await getUserIdByEmail(email);
  await grantAdminRole(userId);

  return email;
}
