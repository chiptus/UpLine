import { Suspense } from "react";
import { Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { TopBar } from "@/components/layout/TopBar";
import { useAuth } from "@/contexts/AuthContext";
import { userGroupsQuery } from "@/api/groups/useUserGroups";
import { SignInRequired } from "@/pages/groups/Groups/SignInRequired";
import { ActiveGroupSetting } from "./ActiveGroupSetting";
import { ActiveScopeSetting } from "./ActiveScopeSetting";

export function SettingsPage() {
  const { user } = useAuth();

  if (!user) {
    return (
      <SignInRequired description="Please sign in to manage your settings" />
    );
  }

  return (
    <div className="min-h-screen">
      <TopBar showBackButton backLabel="Back" />
      <div className="container mx-auto max-w-2xl space-y-8 px-4 py-8">
        <h1 className="text-2xl font-bold text-foreground">Settings</h1>
        <Suspense fallback={<SettingsContentSkeleton />}>
          <SettingsContent userId={user.id} />
        </Suspense>
      </div>
    </div>
  );
}

function SettingsContent({ userId }: { userId: string }) {
  const { data: groups } = useSuspenseQuery(userGroupsQuery(userId));
  const hasGroups = groups.length > 0;

  return (
    <div className="space-y-8">
      {!hasGroups && (
        <p className="text-sm text-muted-foreground">
          <Link to="/groups" className="underline">
            Create or join a group
          </Link>{" "}
          to set an Active group.
        </p>
      )}
      {hasGroups && <ActiveGroupSetting userId={userId} groups={groups} />}
      <ActiveScopeSetting userId={userId} hasGroups={hasGroups} />
    </div>
  );
}

function SettingsContentSkeleton() {
  return (
    <div className="space-y-8 animate-pulse">
      <div className="h-24 rounded-md bg-surface" />
      <div className="h-24 rounded-md bg-surface" />
    </div>
  );
}
