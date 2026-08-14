import { Globe, Star, User as UserIcon, Users } from "lucide-react";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { useActiveScope } from "@/contexts/ActiveScopeContext";

const SCOPE_OPTIONS = [
  { kind: "group" as const, label: "Group", icon: Users },
  { kind: "everyone" as const, label: "Everyone", icon: Globe },
  { kind: "me" as const, label: "Me", icon: UserIcon },
];

export function ActiveScopeSetting() {
  const { hasGroups, pinned, setActiveScope } = useActiveScope();

  const options = hasGroups
    ? SCOPE_OPTIONS
    : SCOPE_OPTIONS.filter((option) => option.kind !== "group");

  return (
    <div>
      <h2 className="text-sm font-semibold text-white">Active scope</h2>
      <p className="mb-3 text-xs text-purple-300">
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
          <ToggleGroupItem
            key={kind}
            value={kind}
            className="gap-1.5 rounded-md border border-purple-400/30 px-3 py-1.5 text-sm text-purple-100 data-[state=on]:border-purple-400 data-[state=on]:bg-purple-600/20 data-[state=on]:font-medium data-[state=on]:text-purple-100 hover:bg-purple-600/10"
            aria-label={`Set active scope to ${label}`}
          >
            <Icon className="h-3.5 w-3.5" />
            {label}
            {pinned.kind === kind && (
              <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
            )}
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
    </div>
  );
}
