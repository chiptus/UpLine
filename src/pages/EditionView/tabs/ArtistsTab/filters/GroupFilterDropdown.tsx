import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Users, ChevronDown } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useUserGroupsQuery } from "@/api/groups/useUserGroups";

interface GroupFilterDropdownProps {
  selectedGroupId?: string;
  onGroupChange: (groupId: string | undefined) => void;
}

export function GroupFilterDropdown({
  selectedGroupId,
  onGroupChange,
}: GroupFilterDropdownProps) {
  const { user } = useAuth();

  if (!user) {
    return null;
  }

  return (
    <GroupFilterDropdownContent
      userId={user.id}
      selectedGroupId={selectedGroupId}
      onGroupChange={onGroupChange}
    />
  );
}

function GroupFilterDropdownContent({
  userId,
  selectedGroupId,
  onGroupChange,
}: GroupFilterDropdownProps & { userId: string }) {
  const { data: groups } = useUserGroupsQuery(userId);

  const hasActiveGroupFilter = selectedGroupId;
  const currentGroup = groups.find((g) => g.id === selectedGroupId);
  const groupDisplayText = currentGroup ? currentGroup.name : "All Votes";

  if (groups.length === 0) {
    return null;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={`flex items-center gap-2 ${
            hasActiveGroupFilter
              ? "bg-purple-600/20 border-purple-400 text-purple-200 hover:bg-purple-600/30"
              : "border-purple-400/30 text-purple-300 hover:bg-white/10 hover:text-purple-200"
          }`}
        >
          <Users className="h-4 w-4" />
          <span className="hidden md:inline">{groupDisplayText}</span>
          <ChevronDown className="h-3 w-3" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="bg-gray-800 border-purple-400/30">
        <DropdownMenuItem
          onClick={() => onGroupChange(undefined)}
          className={`text-purple-100 hover:bg-purple-600/30 ${!selectedGroupId ? "bg-purple-600/20" : ""}`}
        >
          All Votes
        </DropdownMenuItem>
        {groups.map((group) => (
          <DropdownMenuItem
            key={group.id}
            onClick={() => onGroupChange(group.id)}
            className={`text-purple-100 hover:bg-purple-600/30 ${selectedGroupId === group.id ? "bg-purple-600/20" : ""}`}
          >
            {group.name}
            {group.member_count && (
              <span className="text-purple-400 ml-2">
                ({group.member_count})
              </span>
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
