import { Globe, Star, User as UserIcon, Users } from "lucide-react";
import { cn } from "@/lib/utils";
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
      <div className="flex flex-wrap gap-2">
        {options.map(({ kind, label, icon: Icon }) => {
          const isPinned = pinned.kind === kind;
          return (
            <button
              key={kind}
              onClick={() => setActiveScope(kind)}
              className={cn(
                "flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-sm text-purple-100 transition-colors",
                isPinned
                  ? "border-purple-400 bg-purple-600/20 font-medium"
                  : "border-purple-400/30 hover:bg-purple-600/10",
              )}
            >
              <Icon className="h-3.5 w-3.5" />
              {label}
              {isPinned && (
                <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
