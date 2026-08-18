import { Globe, User as UserIcon, Users } from "lucide-react";
import type { PinnedScope } from "@/lib/activeGroup";
import type { Group } from "@/api/groups/types";

export function scopeKey(scope: PinnedScope): string {
  return scope.kind === "group" ? `group:${scope.groupId}` : scope.kind;
}

export function scopeLabel(scope: PinnedScope, groups: Group[]): string {
  if (scope.kind === "everyone") {
    return "Everyone";
  }
  if (scope.kind === "me") {
    return "Me";
  }
  return groups.find((group) => group.id === scope.groupId)?.name ?? "Group";
}

export function scopeIcon(scope: PinnedScope) {
  if (scope.kind === "everyone") {
    return Globe;
  }
  if (scope.kind === "me") {
    return UserIcon;
  }
  return Users;
}
