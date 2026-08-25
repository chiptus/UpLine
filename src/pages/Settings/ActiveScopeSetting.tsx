import { Globe, Star, User as UserIcon, Users } from "lucide-react";
import { ToggleGroup } from "@/components/ui/toggle-group";
import { useActiveScope } from "@/contexts/ActiveScopeContext";
import { useProfileFieldMutation } from "@/api/groups/useProfileFieldMutation";
import { SettingsToggleItem } from "@/pages/Settings/SettingsToggleItem";

const SCOPE_OPTIONS = [
  { kind: "group" as const, label: "Group", icon: Users },
  { kind: "everyone" as const, label: "Everyone", icon: Globe },
  { kind: "me" as const, label: "Me", icon: UserIcon },
];

export function ActiveScopeSetting({
  userId,
  hasGroups,
}: {
  userId: string;
  hasGroups: boolean;
}) {
  const { pinned, clearOverride } = useActiveScope();
  const mutation = useProfileFieldMutation();

  const options = hasGroups
    ? SCOPE_OPTIONS
    : SCOPE_OPTIONS.filter((option) => option.kind !== "group");

  return (
    <div>
      <h2 className="text-sm font-semibold text-foreground">Active scope</h2>
      <p className="mb-3 text-xs text-subtle-foreground">
        Your default steady-state view. The header switcher can override this
        temporarily, but it always reverts back here on a fresh visit.
      </p>
      <ToggleGroup
        type="single"
        value={pinned.kind}
        onValueChange={(value) => {
          if (value === "group" || value === "everyone" || value === "me") {
            setActiveScope(value);
          }
        }}
        className="flex-wrap justify-start gap-2"
      >
        {options.map(({ kind, label, icon: Icon }) => (
          <SettingsToggleItem
            key={kind}
            value={kind}
            ariaLabel={`Set active scope to ${label}`}
          >
            <Icon className="h-3.5 w-3.5" />
            {label}
            {pinned.kind === kind && (
              <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
            )}
          </SettingsToggleItem>
        ))}
      </ToggleGroup>
    </div>
  );

  function setActiveScope(scope: "group" | "everyone" | "me") {
    mutation.mutate({
      userId,
      column: "active_scope",
      value: scope,
      errorMessage: "Failed to update active scope",
    });
    clearOverride();
  }
}
