import { createContext, useContext, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { userGroupsQuery } from "@/api/groups/useUserGroups";
import { useSetActiveGroupMutation } from "@/api/groups/useSetActiveGroupMutation";
import { useSetActiveScopeMutation } from "@/api/groups/useSetActiveScopeMutation";
import { resolveActiveGroupId, resolvePinnedScope } from "@/lib/activeGroup";
import type { PinnedScope } from "@/lib/activeGroup";
import type { Group } from "@/api/groups/types";

interface ActiveScopeContextValue {
  isLoading: boolean;
  groups: Group[];
  hasGroups: boolean;
  /** Which group is "yours" — independent of active scope (group/everyone/me). */
  activeGroupId: string | undefined;
  pinned: PinnedScope;
  current: PinnedScope;
  isOverridden: boolean;
  selectScope: (scope: PinnedScope) => void;
  returnToDefault: () => void;
  setActiveGroup: (groupId: string) => void;
  setActiveScope: (scope: "group" | "everyone" | "me") => void;
}

const EVERYONE_SCOPE: PinnedScope = { kind: "everyone" };

const ANONYMOUS_VALUE: ActiveScopeContextValue = {
  isLoading: false,
  groups: [],
  hasGroups: false,
  activeGroupId: undefined,
  pinned: EVERYONE_SCOPE,
  current: EVERYONE_SCOPE,
  isOverridden: false,
  selectScope: () => {},
  returnToDefault: () => {},
  setActiveGroup: () => {},
  setActiveScope: () => {},
};

const ActiveScopeContext = createContext<ActiveScopeContextValue | undefined>(
  undefined,
);

export function ActiveScopeProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();

  if (!user) {
    return (
      <ActiveScopeContext.Provider value={ANONYMOUS_VALUE}>
        {children}
      </ActiveScopeContext.Provider>
    );
  }

  return (
    <AuthedActiveScopeProvider userId={user.id}>
      {children}
    </AuthedActiveScopeProvider>
  );
}

function scopeEquals(a: PinnedScope, b: PinnedScope): boolean {
  if (a.kind !== b.kind) {
    return false;
  }
  if (a.kind === "group" && b.kind === "group") {
    return a.groupId === b.groupId;
  }
  return true;
}

function AuthedActiveScopeProvider({
  userId,
  children,
}: {
  userId: string;
  children: ReactNode;
}) {
  const { profile } = useAuth();
  const { data: groups = [], isLoading } = useQuery(userGroupsQuery(userId));
  const [override, setOverride] = useState<PinnedScope | null>(null);

  const groupIds = useMemo(() => groups.map((group) => group.id), [groups]);

  const activeGroupId = resolveActiveGroupId({
    activeGroupId: profile?.active_group_id,
    groupIds,
  });

  const pinned = resolvePinnedScope({
    activeGroupId: profile?.active_group_id,
    activeScope: profile?.active_scope,
    groupIds,
  });

  const current = override ?? pinned;
  const isOverridden = override !== null && !scopeEquals(override, pinned);

  const setActiveGroupMutation = useSetActiveGroupMutation();
  const setActiveScopeMutation = useSetActiveScopeMutation();

  function selectScope(scope: PinnedScope) {
    setOverride(scopeEquals(scope, pinned) ? null : scope);
  }

  function returnToDefault() {
    setOverride(null);
  }

  function setActiveGroup(groupId: string) {
    setActiveGroupMutation.mutate({ userId, groupId });
    setOverride(null);
  }

  function setActiveScope(scope: "group" | "everyone" | "me") {
    setActiveScopeMutation.mutate({ userId, scope });
    setOverride(null);
  }

  const value: ActiveScopeContextValue = {
    isLoading,
    groups,
    hasGroups: groups.length > 0,
    activeGroupId,
    pinned,
    current,
    isOverridden,
    selectScope,
    returnToDefault,
    setActiveGroup,
    setActiveScope,
  };

  return (
    <ActiveScopeContext.Provider value={value}>
      {children}
    </ActiveScopeContext.Provider>
  );
}

export function useActiveScope(): ActiveScopeContextValue {
  const context = useContext(ActiveScopeContext);
  if (context === undefined) {
    throw new Error(
      "useActiveScope must be used within an ActiveScopeProvider",
    );
  }
  return context;
}
