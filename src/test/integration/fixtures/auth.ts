import { supabase } from "@/integrations/supabase/client";
import { registerCleanup, testSupabase } from "../harness";

/**
 * Signs the app's real Supabase client (the one hooks under test import) in
 * as a fresh, uniquely-named user — for RLS-gated integration tests that
 * need a real session, not a mocked one. Returns the new user's id.
 *
 * Mints a signup-confirmation token via the service-role admin API — which
 * also creates the underlying `auth.users` row and, via the
 * `handle_new_user` trigger, its `profiles` row — then redeems that token
 * through the same `verifyOtp` call the app's real OTP flow uses. Type must
 * be "signup" on both calls: since the email never has an existing user,
 * GoTrue issues the link as a signup confirmation regardless of the type
 * requested, and verifying it as "magiclink" fails as an invalid/expired
 * token even though it's neither. No email is sent and nothing polls
 * Mailpit; the local stack's SMTP capture is bypassed entirely.
 */
export async function signInAsTestUser(): Promise<string> {
  const email = `test-user-${crypto.randomUUID()}@example.com`;

  const { data: link, error: linkError } =
    await testSupabase.auth.admin.generateLink({
      type: "signup",
      email,
      password: crypto.randomUUID(),
    });
  if (linkError) throw linkError;

  const { data: verified, error: verifyError } = await supabase.auth.verifyOtp({
    token_hash: link.properties.hashed_token,
    type: "signup",
  });
  if (verifyError) throw verifyError;
  if (!verified.session) {
    throw new Error("verifyOtp did not return a session");
  }

  const userId = link.user.id;

  registerCleanup(async () => {
    const { error: signOutError } = await supabase.auth.signOut();
    const { error: deleteError } =
      await testSupabase.auth.admin.deleteUser(userId);

    if (signOutError) throw signOutError;
    if (deleteError) throw deleteError;
  });

  return userId;
}
