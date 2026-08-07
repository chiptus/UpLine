import { Link } from "@tanstack/react-router";
import { TopBar } from "@/components/layout/TopBar";
import { useAuth } from "@/contexts/AuthContext";
import { useActiveScope } from "@/contexts/ActiveScopeContext";
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
    <div className="min-h-screen bg-app-gradient">
      <TopBar showBackButton backLabel="Back" />
      <div className="container mx-auto max-w-2xl space-y-8 px-4 py-8">
        <h1 className="text-2xl font-bold text-white">Settings</h1>
        <SettingsContent />
      </div>
    </div>
  );
}

function SettingsContent() {
  const { hasGroups } = useActiveScope();

  return (
    <div className="space-y-8">
      {!hasGroups && (
        <p className="text-sm text-purple-200">
          <Link to="/groups" className="underline">
            Create or join a group
          </Link>{" "}
          to set an Active group.
        </p>
      )}
      {hasGroups && <ActiveGroupSetting />}
      <ActiveScopeSetting />
    </div>
  );
}
