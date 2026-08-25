import { GroupCard } from "./GroupCard";
import { Card, CardContent } from "@/components/ui/card";
import { Group } from "@/api/groups/types";
import { Users } from "lucide-react";

export function MyGroupsList({
  groups,
  loading,
  onDelete,
  showMembershipBadges = false,
}: {
  groups: Group[];
  loading: boolean;
  onDelete: (id: string, name: string) => void;
  showMembershipBadges?: boolean;
}) {
  if (loading) {
    return <div className="text-center text-foreground">Loading groups...</div>;
  }

  if (groups.length === 0) {
    return (
      <Card className="bg-surface border-border">
        <CardContent className="text-center py-12">
          <Users className="h-12 w-12 mx-auto mb-4 text-accent" />
          <h3 className="text-xl font-semibold text-foreground mb-2">
            No groups yet
          </h3>
          <p className="text-muted-foreground mb-4">
            Create your first group to start sharing votes with friends
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {groups.map((group) => (
        <GroupCard
          key={group.id}
          group={group}
          onDelete={() => onDelete(group.id, group.name)}
          showMembershipBadge={showMembershipBadges}
        />
      ))}
    </div>
  );
}
