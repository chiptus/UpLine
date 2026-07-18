import { Page, expect } from "@playwright/test";
import { TEST_CONFIG } from "../config/test-env";

interface MailpitMessageSummary {
  ID: string;
  To: Array<{ Address: string }>;
}

interface MailpitMessage {
  Text?: string;
  HTML?: string;
}

export class TestHelpers {
  constructor(private page: Page) {}

  /**
   * Sign in via the app's real magic-link + OTP flow, reading the one-time
   * code from the local Supabase stack's Mailpit inbox. Completes onboarding
   * (username step) for brand-new voters so it doesn't block later
   * interactions. Returns the email that was signed in.
   */
  async signIn(email = generateTestEmail()) {
    await this.page.goto("/");
    await this.acceptCookieConsentIfPresent();

    await this.page.getByRole("button", { name: /sign in/i }).click();

    const authDialog = this.page.getByRole("dialog");
    await expect(authDialog).toBeVisible();

    await this.page.getByLabel(/^email$/i).fill(email);
    await this.page.getByRole("button", { name: /send magic link/i }).click();

    const otp = await fetchOtpCode(email);

    await this.page.locator("input[data-input-otp]").fill(otp);
    await this.page.getByRole("button", { name: /verify code/i }).click();

    await expect(
      this.page.getByRole("button", { name: /user menu/i }),
    ).toBeVisible({
      timeout: 15000,
    });

    await this.completeOnboardingIfPresent();

    return email;
  }

  /**
   * Fills in and submits the username step of the onboarding dialog (shown
   * for brand-new accounts) and skips the rest, so it stops blocking the
   * page. No-ops if onboarding isn't showing.
   */
  async completeOnboardingIfPresent() {
    const onboardingDialog = this.page.getByRole("dialog", {
      name: /welcome to upline/i,
    });

    const appeared = await onboardingDialog
      .waitFor({ state: "visible", timeout: 5000 })
      .then(() => true)
      .catch(() => false);

    if (!appeared) return;

    await this.page.getByLabel(/username/i).fill(`e2e-voter-${Date.now()}`);
    await this.page.getByRole("button", { name: /continue/i }).click();

    await this.page.getByRole("button", { name: /^skip$/i }).click();
    await expect(onboardingDialog).not.toBeVisible();
  }

  /**
   * Dismisses the cookie consent banner if it's showing. On mobile
   * viewports the banner sits fixed to the bottom of the screen and
   * intercepts clicks on anything positioned near it (e.g. vote buttons),
   * so this must run before any such interaction. No-ops if it isn't
   * showing (e.g. already dismissed earlier in this browser context).
   */
  async acceptCookieConsentIfPresent() {
    const acceptAllButton = this.page.getByRole("button", {
      name: /^accept all$/i,
    });

    const appeared = await acceptAllButton
      .waitFor({ state: "visible", timeout: 5000 })
      .then(() => true)
      .catch(() => false);

    if (!appeared) return;

    await acceptAllButton.click();
    await expect(acceptAllButton).not.toBeVisible();
  }

  /**
   * Sign out
   */
  async signOut() {
    const userMenu = this.page.getByRole("button", { name: /user menu/i });

    if (await userMenu.isVisible()) {
      await userMenu.click();

      await this.page.getByRole("menuitem", { name: /sign out/i }).click();

      await expect(
        this.page.getByRole("button", { name: /sign in/i }),
      ).toBeVisible();
    }
  }

  /**
   * Wait for page to be fully loaded
   */
  async waitForPageLoad() {
    await this.page.waitForLoadState("networkidle");
  }

  /**
   * Check if user is authenticated
   */
  async isAuthenticated(): Promise<boolean> {
    return await this.page
      .getByRole("button", { name: /user menu/i })
      .isVisible();
  }

  /**
   * Navigate to a specific page
   */
  async navigateTo(path: string) {
    await this.page.goto(path);
    await this.waitForPageLoad();
  }

  /**
   * Wait for a specific element to be visible
   */
  async waitForElement(selector: string, timeout = 5000) {
    await this.page.waitForSelector(selector, { timeout });
  }

  /**
   * Take a screenshot for debugging
   */
  async takeScreenshot(name: string) {
    await this.page.screenshot({ path: `tests/screenshots/${name}.png` });
  }
}

/**
 * Builds an email unique to this worker so parallel test runs never share
 * (and race over) the same Mailpit inbox or the same underlying auth user.
 */
export function generateTestEmail(suffix: string | number = process.pid) {
  return `${TEST_CONFIG.TEST_USER_EMAIL_BASE}-${suffix}@${TEST_CONFIG.TEST_USER_EMAIL_DOMAIN}`;
}

/**
 * Polls the local Supabase stack's Mailpit inbox for the most recent email
 * sent to `email` and extracts the 6-digit OTP from its body.
 */
async function fetchOtpCode(email: string): Promise<string> {
  const deadline = Date.now() + 20000;

  while (Date.now() < deadline) {
    const summary = await findLatestMessageTo(email);

    if (summary) {
      const code = await extractOtpFromMessage(summary.ID);
      if (code) return code;
    }

    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  throw new Error(`Timed out waiting for an OTP email to ${email} in Mailpit`);
}

async function findLatestMessageTo(
  email: string,
): Promise<MailpitMessageSummary | undefined> {
  const response = await fetch(
    `${TEST_CONFIG.MAILPIT_URL}/api/v1/messages?limit=50`,
  );

  if (!response.ok) return undefined;

  const data = (await response.json()) as { messages: MailpitMessageSummary[] };

  return data.messages?.find((message) =>
    message.To?.some((to) => to.Address.toLowerCase() === email.toLowerCase()),
  );
}

async function extractOtpFromMessage(
  messageId: string,
): Promise<string | undefined> {
  const response = await fetch(
    `${TEST_CONFIG.MAILPIT_URL}/api/v1/message/${messageId}`,
  );

  if (!response.ok) return undefined;

  const message = (await response.json()) as MailpitMessage;
  const body = message.Text || message.HTML || "";

  const otpMatch = body.match(/otp-code[^>]*>\s*(\d{6})/i);
  if (otpMatch) return otpMatch[1];

  const genericMatch = body.match(/\b(\d{6})\b/);
  return genericMatch?.[1];
}
