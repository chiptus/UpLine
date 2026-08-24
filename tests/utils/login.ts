import { Page, expect } from "@playwright/test";
import { TEST_CONFIG } from "../config/test-env";
import { fetchOtpCode } from "./otp";

// Signs in via the OTP flow, pre-onboarding the voter so onboarding never shows here.
export async function signIn(page: Page, email = generateTestEmail()) {
  await submitOtpSignIn(page, email, { preOnboard: true });

  await expect(page.getByRole("button", { name: /user menu/i })).toBeVisible({
    timeout: 15000,
  });

  return email;
}

// Signs in a fresh, pre-onboarded admin user via OTP — a distinct email per
// call (rather than the shared seeded admin) so concurrent sign-ins across
// parallel workers/browser projects never race over the same Mailpit inbox.
export async function signInAsAdmin(page: Page, email = generateTestEmail()) {
  await submitOtpSignIn(page, email, { preOnboard: true, asAdmin: true });

  await expect(page.getByRole("button", { name: /user menu/i })).toBeVisible({
    timeout: 15000,
  });

  return email;
}

// Runs the OTP flow up through code verification; pass preOnboard to skip onboarding.
export async function submitOtpSignIn(
  page: Page,
  email: string,
  {
    preOnboard = false,
    asAdmin = false,
  }: { preOnboard?: boolean; asAdmin?: boolean } = {},
) {
  if (preOnboard) {
    const userId = await createPreOnboardedUser(email);
    if (asAdmin) {
      await grantAdminRole(userId);
    }
  }

  await page.goto("/");

  await page.getByRole("button", { name: /sign in/i }).click();

  const authDialog = page.getByRole("dialog");
  await expect(authDialog).toBeVisible();

  await page.getByLabel(/^email$/i).fill(email);
  // 2s buffer guards against clock skew with the Mailpit container.
  const requestedAt = Date.now() - 2000;
  await page.getByRole("button", { name: /send magic link/i }).click();

  const otp = await fetchOtpCode(email, requestedAt);

  await page.locator("input[data-input-otp]").fill(otp);
  await page.getByRole("button", { name: /verify code/i }).click();
}

export async function signOut(page: Page) {
  const userMenu = page.getByRole("button", { name: /user menu/i });

  if (await userMenu.isVisible()) {
    await userMenu.click();

    await page.getByRole("menuitem", { name: /sign out/i }).click();

    await expect(page.getByRole("button", { name: /sign in/i })).toBeVisible();
  }
}

export async function isAuthenticated(page: Page): Promise<boolean> {
  return await page.getByRole("button", { name: /user menu/i }).isVisible();
}

// Unique per call so concurrent/sequential signIns never race over the same OTP inbox.
export function generateTestEmail(
  suffix:
    | string
    | number = `${process.pid}-${Math.random().toString(36).slice(2, 8)}`,
) {
  return `${TEST_CONFIG.TEST_USER_EMAIL_BASE}-${suffix}@${TEST_CONFIG.TEST_USER_EMAIL_DOMAIN}`;
}

const ADMIN_HEADERS = {
  "Content-Type": "application/json",
  apikey: TEST_CONFIG.SUPABASE_SERVICE_ROLE_KEY,
  Authorization: `Bearer ${TEST_CONFIG.SUPABASE_SERVICE_ROLE_KEY}`,
};

// Pre-creates an already-onboarded voter via the admin API so OTP sign-in never shows onboarding.
async function createPreOnboardedUser(email: string): Promise<string> {
  const username = email.split("@")[0];

  const createResponse = await fetch(
    `${TEST_CONFIG.SUPABASE_URL}/auth/v1/admin/users`,
    {
      method: "POST",
      headers: ADMIN_HEADERS,
      body: JSON.stringify({
        email,
        email_confirm: true,
        user_metadata: { username },
      }),
    },
  );

  if (!createResponse.ok) {
    throw new Error(
      `Failed to pre-create onboarded test user ${email}: ${createResponse.status}`,
    );
  }

  const { id } = (await createResponse.json()) as { id: string };

  await fetch(`${TEST_CONFIG.SUPABASE_URL}/rest/v1/profiles?id=eq.${id}`, {
    method: "PATCH",
    headers: { ...ADMIN_HEADERS, Prefer: "return=minimal" },
    body: JSON.stringify({ completed_onboarding: true }),
  });

  return id;
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
    throw new Error(
      `Failed to grant admin role to test user ${userId}: ${response.status} ${await response.text()}`,
    );
  }
}
