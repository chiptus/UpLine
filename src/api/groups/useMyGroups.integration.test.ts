import { describe, expect, it } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { useQuery } from "@tanstack/react-query";
import { myGroupsQuery } from "./useMyGroups";
import { createQueryWrapper } from "@/test/integration/harness";
import { signInAsTestUser } from "@/test/integration/fixtures/auth";
import {
  addGroupMember,
  createGroup,
} from "@/test/integration/fixtures/groups";

describe("myGroupsQuery", () => {
  it("returns only the groups the caller is a member of", async () => {
    const userId = await signInAsTestUser();
    const myGroupId = await createGroup(userId);
    await addGroupMember(myGroupId, userId);
    // A group the caller has no membership row in at all.
    const otherGroupId = await createGroup(crypto.randomUUID());
    await addGroupMember(otherGroupId, crypto.randomUUID());

    const { result } = renderHook(() => useQuery(myGroupsQuery(userId)), {
      wrapper: createQueryWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data?.map((group) => group.id)).toEqual([myGroupId]);
  });

  it("marks is_member true and is_creator correctly, without an admin check", async () => {
    const userId = await signInAsTestUser();
    const ownGroupId = await createGroup(userId);
    await addGroupMember(ownGroupId, userId);
    const joinedGroupId = await createGroup(crypto.randomUUID());
    await addGroupMember(joinedGroupId, userId);

    const { result } = renderHook(() => useQuery(myGroupsQuery(userId)), {
      wrapper: createQueryWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    const ownGroup = result.current.data?.find((g) => g.id === ownGroupId);
    const joinedGroup = result.current.data?.find(
      (g) => g.id === joinedGroupId,
    );
    expect(ownGroup).toMatchObject({ is_member: true, is_creator: true });
    expect(joinedGroup).toMatchObject({ is_member: true, is_creator: false });
  });

  it("reflects every member in member_count, not just the caller", async () => {
    const userId = await signInAsTestUser();
    const groupId = await createGroup(userId);
    await addGroupMember(groupId, userId);
    await addGroupMember(groupId, crypto.randomUUID());

    const { result } = renderHook(() => useQuery(myGroupsQuery(userId)), {
      wrapper: createQueryWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(
      result.current.data?.find((g) => g.id === groupId)?.member_count,
    ).toBe(2);
  });

  it("returns an empty array for a user with no groups", async () => {
    const userId = await signInAsTestUser();

    const { result } = renderHook(() => useQuery(myGroupsQuery(userId)), {
      wrapper: createQueryWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual([]);
  });
});
