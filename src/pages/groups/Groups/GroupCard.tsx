import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, Trash2, Crown } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { useLeaveGroupMutation } from "@/api/groups/useLeaveGroup";
import { Group } from "@/api/groups/types";
import { useAuth } from "@/contexts/AuthContext";

export function GroupCard({
  group,
  onDelete,
  showMembershipBadge = false,
}: {
  group: Group;
  onDelete: () => void;
  showMembershipBadge?: boolean;
}) {
  const { user } = useAuth();
  const leaveGroupMutation = useLeaveGroupMutation();

  return (
    <Link
      to="/groups/$groupSlug"
      params={{ groupSlug: group.slug }}
      className="block"
    >
      <Card className="bg-white/10 border-purple-400/30">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="flex items-center space-x-2 text-white">
                <span>{group.name}</span>
                {group.is_creator && (
                  <Badge
                    variant="secondary"
                    className="text-xs bg-purple-600/50 text-purple-100"
                  >
                    <Crown className="h-3 w-3 mr-1" />
                    Creator
                  </Badge>
                )}
                {showMembershipBadge && (
                  <Badge
                    variant={group.is_member ? "default" : "outline"}
                    className={
                      group.is_member
                        ? "text-xs bg-green-600/50 text-green-100 border-green-400/30"
                        : "text-xs bg-transparent text-gray-300 border-gray-400/30"
                    }
                  >
                    {group.is_member ? "Member" : "Not Member"}
                  </Badge>
                )}
              </CardTitle>
              {group.description && (
                <CardDescription className="mt-1 text-purple-200">
                  {group.description}
                </CardDescription>
              )}
            </div>
            <div className="flex space-x-2">
              {group.is_creator ? (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onDelete();
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleLeaveGroup();
                  }}
                  className="bg-white/10 border-purple-400/30 text-white hover:bg-white/20"
                >
                  Leave
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 text-sm text-purple-200">
              <Users className="h-4 w-4" />
              <span>{group.member_count} members</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );

  async function handleLeaveGroup() {
    if (window.confirm("Are you sure you want to leave this group?")) {
      leaveGroupMutation.mutate({ groupId: group.id, userId: user?.id || "" });
    }
  }
}
