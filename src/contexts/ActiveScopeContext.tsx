import { createContext, useContext, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { userGroupsQuery } from "@/api/groups/useUserGroups";
import { resolveActiveGroupId, resolvePinnedScope } from "@/lib/activeGroup";
import type { PinnedScope } from "@/lib/activeGroup";

interface ActiveScopeContextValue {
  /** Which group is "yours" — independent of active scope (group/everyone/me). */
  activeGroupId: string | undefined;
  pinned: PinnedScope;
  current: PinnedScope;
  selectScope: (scope: PinnedScope) => void;
  /** Drops the transient header override so the durable Settings pin applies immediately. */
  clearOverride: () => void;
}

const EVERYONE_SCOPE: PinnedScope = { kind: "everyone" };

const ANONYMOUS_VALUE: ActiveScopeContextValue = {
  activeGroupId: undefined,
  pinned: EVERYONE_SCOPE,
  current: EVERYONE_SCOPE,
  selectScope: () => {},
  clearOverride: () => {},
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
  const { data: groups = [] } = useQuery(userGroupsQuery(userId));
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

  function selectScope(scope: PinnedScope) {
    setOverride(scopeEquals(scope, pinned) ? null : scope);
  }

  function clearOverride() {
    setOverride(null);
  }

  const value: ActiveScopeContextValue = {
    activeGroupId,
    pinned,
    current,
    selectScope,
    clearOverride,
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
