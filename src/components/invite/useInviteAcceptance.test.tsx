import { describe, expect, it, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import type { User } from "@supabase/supabase-js";
import { useInviteAcceptance } from "./useInviteAcceptance";
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

function mockRpcResult(result: {
  success: boolean;
  message: string;
  group_id: string | null;
}) {
  rpcMock.mockResolvedValue({ data: [result], error: null } as never);
}

function renderAcceptance(
  initialProps: Parameters<typeof useInviteAcceptance>[0],
) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");

  const view = renderHook(useInviteAcceptance, {
    initialProps,
    wrapper: function Wrapper({ children }: { children: ReactNode }) {
      return (
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      );
    },
  });

  return { ...view, invalidateSpy };
}

describe("useInviteAcceptance", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("accepts the invite when a user and a valid invite are present", async () => {
    mockRpcResult({
      success: true,
      message: "Successfully joined group",
      group_id: "group-1",
    });

    const { invalidateSpy } = renderAcceptance({
      inviteToken: "token-1",
      inviteValidation: validInvite,
      user,
    });

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
    mockRpcResult({
      success: true,
      message: "Successfully joined group",
      group_id: "group-1",
    });

    const { rerender } = renderAcceptance({
      inviteToken: "token-1",
      inviteValidation: validInvite,
      user: null,
    });

    expect(rpcMock).not.toHaveBeenCalled();

    rerender({
      inviteToken: "token-1",
      inviteValidation: validInvite,
      user,
    });

    await waitFor(() => expect(rpcMock).toHaveBeenCalledTimes(1));
  });

  it("does not call the RPC for an invalid invite", async () => {
    renderAcceptance({
      inviteToken: "token-1",
      inviteValidation: {
        ...validInvite,
        is_valid: false,
        reason: "invite_expired",
      },
      user,
    });

    await Promise.resolve();
    expect(rpcMock).not.toHaveBeenCalled();
  });

  it("surfaces an already-member reuse cleanly without an error", async () => {
    mockRpcResult({
      success: false,
      message: "User already in group",
      group_id: "group-1",
    });

    const { invalidateSpy } = renderAcceptance({
      inviteToken: "token-1",
      inviteValidation: validInvite,
      user,
    });

    await waitFor(() =>
      expect(toastMock).toHaveBeenCalledWith({
        title: "Already a member",
        description: "You're already a member of Festival Crew.",
      }),
    );

    expect(toastMock).not.toHaveBeenCalledWith(
      expect.objectContaining({ variant: "destructive" }),
    );
    expect(invalidateSpy).not.toHaveBeenCalled();
    expect(navigateMock).toHaveBeenCalled();
  });

  it("shows an error toast and keeps the invite param when the RPC fails", async () => {
    mockRpcResult({
      success: false,
      message: "Invalid invite token",
      group_id: null,
    });

    renderAcceptance({
      inviteToken: "token-1",
      inviteValidation: validInvite,
      user,
    });

    await waitFor(() =>
      expect(toastMock).toHaveBeenCalledWith({
        title: "Couldn't join group",
        description: "Invalid invite token",
        variant: "destructive",
      }),
    );

    expect(navigateMock).not.toHaveBeenCalled();
  });

  it("only accepts once per token across re-renders", async () => {
    mockRpcResult({
      success: true,
      message: "Successfully joined group",
      group_id: "group-1",
    });

    const { rerender } = renderAcceptance({
      inviteToken: "token-1",
      inviteValidation: validInvite,
      user,
    });

    await waitFor(() => expect(rpcMock).toHaveBeenCalledTimes(1));

    rerender({
      inviteToken: "token-1",
      inviteValidation: validInvite,
      user,
    });

    await Promise.resolve();
    expect(rpcMock).toHaveBeenCalledTimes(1);
  });
});
