import { describe, expect, it, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { Fragment } from "react";
import type { User } from "@supabase/supabase-js";
import { withTestQuery } from "@/test/withTestQuery";
import { useInviteFlow } from "./useInviteFlow";
import { supabase } from "@/integrations/supabase/client";
import type { InviteValidation } from "@/types/invites";

const { navigateMock, toastMock } = vi.hoisted(() => ({
  navigateMock: vi.fn(),
  toastMock: vi.fn(),
}));

vi.mock("@/integrations/supabase/client", () => ({
  supabase: { rpc: vi.fn() },
}));

vi.mock("@tanstack/react-router", () => ({
  useNavigate: () => navigateMock,
}));

vi.mock("@/components/ui/use-toast", () => ({
  useToast: () => ({ toast: toastMock }),
}));

const rpcMock = vi.mocked(supabase.rpc);

const user = { id: "user-1" } as User;

const validInvite: InviteValidation = {
  invite_id: "invite-row-id",
  group_id: "group-1",
  group_name: "Festival Crew",
  is_valid: true,
  reason: "valid",
};

const joinedResult = {
  success: true,
  message: "Successfully joined group",
  group_id: "group-1",
};

function mockRpc(
  validation: InviteValidation | null,
  useResult: { success: boolean; message: string; group_id: string | null },
) {
  rpcMock.mockImplementation((async (fn: string) => {
    if (fn === "validate_invite_token") {
      return { data: validation ? [validation] : [], error: null };
    }
    return { data: [useResult], error: null };
  }) as never);
}

function useInviteTokenCalls() {
  return rpcMock.mock.calls.filter(([fn]) => fn === "use_invite_token");
}

function renderFlow(initialProps: {
  token: string | undefined;
  user: User | null;
}) {
  const wrapper = withTestQuery(Fragment);
  const invalidateSpy = vi.spyOn(wrapper.queryClient, "invalidateQueries");

  const view = renderHook(
    (props: { token: string | undefined; user: User | null }) =>
      useInviteFlow(props.token, props.user),
    { initialProps, wrapper },
  );

  return { ...view, invalidateSpy };
}

describe("useInviteFlow", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("validates the token then accepts the invite when a user is present", async () => {
    mockRpc(validInvite, joinedResult);

    const { result, invalidateSpy } = renderFlow({ token: "token-1", user });

    await waitFor(() =>
      expect(rpcMock).toHaveBeenCalledWith("validate_invite_token", {
        token: "token-1",
      }),
    );
    await waitFor(() =>
      expect(rpcMock).toHaveBeenCalledWith("use_invite_token", {
        token: "token-1",
        user_id: "user-1",
      }),
    );

    await waitFor(() =>
      expect(toastMock).toHaveBeenCalledWith({
        title: "Success",
        description: "Welcome to Festival Crew!",
      }),
    );

    expect(result.current.hasValidInvite).toBe(true);
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ["groups"] });
    expect(navigateMock).toHaveBeenCalledWith({
      to: ".",
      search: expect.any(Function),
      replace: true,
    });

    const searchUpdater = navigateMock.mock.calls[0][0].search;
    expect(searchUpdater({ invite: "token-1", day: "friday" })).toEqual({
      invite: undefined,
      day: "friday",
    });
  });

  it("waits for the user to sign in before accepting", async () => {
    mockRpc(validInvite, joinedResult);

    const { result, rerender } = renderFlow({ token: "token-1", user: null });

    await waitFor(() => expect(result.current.hasValidInvite).toBe(true));
    expect(useInviteTokenCalls()).toHaveLength(0);

    rerender({ token: "token-1", user });

    await waitFor(() => expect(useInviteTokenCalls()).toHaveLength(1));
  });

  it("shows the expired message and never consumes an invalid invite", async () => {
    mockRpc(
      { ...validInvite, is_valid: false, reason: "invite_expired" },
      joinedResult,
    );

    const { result } = renderFlow({ token: "token-1", user });

    await waitFor(() =>
      expect(toastMock).toHaveBeenCalledWith({
        title: "Invalid Invite",
        description: "This invite link has expired",
        variant: "destructive",
      }),
    );

    expect(result.current.hasValidInvite).toBe(false);
    expect(useInviteTokenCalls()).toHaveLength(0);
  });

  it("surfaces an already-member reuse cleanly without an error", async () => {
    mockRpc(validInvite, {
      success: false,
      message: "User already in group",
      group_id: "group-1",
    });

    const { invalidateSpy } = renderFlow({ token: "token-1", user });

    await waitFor(() =>
      expect(toastMock).toHaveBeenCalledWith({
        title: "Already a member",
        description: "You're already a member of Festival Crew.",
      }),
    );

    expect(toastMock).not.toHaveBeenCalledWith(
      expect.objectContaining({ variant: "destructive" }),
    );
    expect(invalidateSpy).not.toHaveBeenCalledWith({ queryKey: ["groups"] });
    expect(navigateMock).toHaveBeenCalled();
  });

  it("shows an error toast and keeps the invite param when acceptance fails", async () => {
    mockRpc(validInvite, {
      success: false,
      message: "Invalid invite token",
      group_id: null,
    });

    renderFlow({ token: "token-1", user });

    await waitFor(() =>
      expect(toastMock).toHaveBeenCalledWith({
        title: "Couldn't join group",
        description: "Invalid invite token",
        variant: "destructive",
      }),
    );

    expect(navigateMock).not.toHaveBeenCalled();
  });

  it("allows a retry after a failed attempt", async () => {
    mockRpc(validInvite, {
      success: false,
      message: "Invalid invite token",
      group_id: null,
    });

    const { rerender } = renderFlow({ token: "token-1", user });

    await waitFor(() => expect(useInviteTokenCalls()).toHaveLength(1));

    mockRpc(validInvite, joinedResult);
    rerender({ token: "token-1", user: { ...user } });

    await waitFor(() => expect(useInviteTokenCalls()).toHaveLength(2));
  });

  it("only accepts once per token across re-renders", async () => {
    mockRpc(validInvite, joinedResult);

    const { rerender } = renderFlow({ token: "token-1", user });

    await waitFor(() => expect(useInviteTokenCalls()).toHaveLength(1));

    rerender({ token: "token-1", user });

    await Promise.resolve();
    expect(useInviteTokenCalls()).toHaveLength(1);
  });
});
