import { TEST_CONFIG } from "../config/test-env";

interface MailpitMessageSummary {
  ID: string;
  To: Array<{ Address: string }>;
  Created: string;
}

interface MailpitMessage {
  Text?: string;
  HTML?: string;
}

// Polls Mailpit for the OTP email sent after sentAfter, ignoring stale messages from earlier runs.
export async function fetchOtpCode(
  email: string,
  sentAfter: number,
): Promise<string> {
  const deadline = Date.now() + 20000;

  while (Date.now() < deadline) {
    const summary = await findLatestMessageTo(email, sentAfter);

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
  sentAfter: number,
): Promise<MailpitMessageSummary | undefined> {
  const response = await fetch(
    `${TEST_CONFIG.MAILPIT_URL}/api/v1/messages?limit=50`,
  );

  if (!response.ok) return undefined;

  const data = (await response.json()) as { messages: MailpitMessageSummary[] };

  return data.messages?.find(
    (message) =>
      message.To?.some(
        (to) => to.Address.toLowerCase() === email.toLowerCase(),
      ) && Date.parse(message.Created) >= sentAfter,
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
