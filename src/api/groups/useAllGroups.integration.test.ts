import { describe, expect, it } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { useQuery } from "@tanstack/react-query";
import { allGroupsQuery } from "./useAllGroups";
import { createQueryWrapper } from "@/test/integration/harness";
import { signInAsTestUser } from "@/test/integration/fixtures/auth";
import { grantAdminRole } from "@/test/integration/fixtures/adminRoles";
import {
  addGroupMember,
  createGroup,
} from "@/test/integration/fixtures/groups";

describe("allGroupsQuery", () => {
  it("falls back to member-only results for a non-admin caller", async () => {
    const userId = await signInAsTestUser();
    const myGroupId = await createGroup(userId);
    await addGroupMember(myGroupId, userId);
    // A group the caller has no membership row in at all.
    const otherGroupId = await createGroup(crypto.randomUUID());
    await addGroupMember(otherGroupId, crypto.randomUUID());

    const { result } = renderHook(() => useQuery(allGroupsQuery(userId)), {
      wrapper: createQueryWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data?.map((group) => group.id)).toEqual([myGroupId]);
  });

  it("returns every non-archived group for a super-admin caller, with is_member computed per group", async () => {
    const userId = await signInAsTestUser();
    await grantAdminRole(userId, "super_admin");
    const myGroupId = await createGroup(userId);
    await addGroupMember(myGroupId, userId);
    const otherGroupId = await createGroup(crypto.randomUUID());
    await addGroupMember(otherGroupId, crypto.randomUUID());

    const { result } = renderHook(() => useQuery(allGroupsQuery(userId)), {
      wrapper: createQueryWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    const myGroup = result.current.data?.find((g) => g.id === myGroupId);
    const otherGroup = result.current.data?.find((g) => g.id === otherGroupId);
    expect(myGroup?.is_member).toBe(true);
    expect(otherGroup).toBeDefined();
    expect(otherGroup?.is_member).toBe(false);
  });
});
