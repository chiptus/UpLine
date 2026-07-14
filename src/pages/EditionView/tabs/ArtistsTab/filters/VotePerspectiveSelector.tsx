import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Eye, Users } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

interface VotePerspectiveSelectorProps {
  selectedGroupId?: string;
  groups: Array<{ id: string; name: string; member_count?: number }>;
  onGroupChange: (groupId: string | undefined) => void;
  isMobile?: boolean;
}

export function VotePerspectiveSelector({
  selectedGroupId,
  groups,
  onGroupChange,
  isMobile = false,
}: VotePerspectiveSelectorProps) {
  const { user } = useAuth();

  const perspectiveOptions = [
    {
      id: "all",
      label: "All Groups",
      description: "View votes from all users",
    },
    {
      id: "mine",
      label: "My Votes Only",
      description: "View only your personal votes",
    },
    ...groups.map((group) => ({
      id: group.id,
      label: group.name,
      description: `View votes from ${group.name} members`,
      memberCount: group.member_count,
    })),
  ];

  function getCurrentValue() {
    if (!selectedGroupId) return "all";
    if (selectedGroupId === user?.id) return "mine";
    return selectedGroupId;
  }

  function handleChange(value: string) {
    if (value === "all") {
      onGroupChange(undefined);
    } else if (value === "mine") {
      onGroupChange(user?.id);
    } else {
      onGroupChange(value);
    }
  }

  if (isMobile) {
    return (
      <div className="space-y-2">
        <div className="flex items-center gap-2 mb-2">
          <Eye className="h-4 w-4 text-purple-300" />
          <h4 className="text-sm font-medium text-purple-200">
            Vote Perspective
          </h4>
        </div>
        <p className="text-xs text-purple-400 mb-3">
          Choose whose votes to count in scores
        </p>
        <Select value={getCurrentValue()} onValueChange={handleChange}>
          <SelectTrigger className="w-full bg-white/10 border-purple-400/30 text-purple-100">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-gray-800 border-purple-400/30">
            {perspectiveOptions.map((option) => (
              <SelectItem
                key={option.id}
                value={option.id}
                className="text-purple-100"
              >
                <div>
                  <div className="font-medium">{option.label}</div>
                  <div className="text-xs text-purple-400">
                    {option.description}
                  </div>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Eye className="h-4 w-4 text-purple-300" />
        <h4 className="text-sm font-medium text-purple-200">
          Vote Perspective
        </h4>
      </div>
      <p className="text-xs text-purple-400">
        Choose whose votes to count in scores
      </p>
      <div className="flex flex-wrap gap-2">
        <Button
          variant={!selectedGroupId ? "default" : "outline"}
          size="sm"
          onClick={() => onGroupChange(undefined)}
          className={
            !selectedGroupId
              ? "bg-purple-600 hover:bg-purple-700"
              : "border-purple-400 text-purple-400 hover:bg-purple-400 hover:text-white"
          }
        >
          <Users className="h-3 w-3 mr-1" />
          All Groups
        </Button>
        {user && (
          <Button
            variant={selectedGroupId === user.id ? "default" : "outline"}
            size="sm"
            onClick={() => onGroupChange(user.id)}
            className={
              selectedGroupId === user.id
                ? "bg-purple-600 hover:bg-purple-700"
                : "border-purple-400 text-purple-400 hover:bg-purple-400 hover:text-white"
            }
          >
            <Eye className="h-3 w-3 mr-1" />
            My Votes Only
          </Button>
        )}
        {groups.map((group) => (
          <Button
            key={group.id}
            variant={selectedGroupId === group.id ? "default" : "outline"}
            size="sm"
            onClick={() => onGroupChange(group.id)}
            className={
              selectedGroupId === group.id
                ? "bg-purple-600 hover:bg-purple-700"
                : "border-purple-400 text-purple-400 hover:bg-purple-400 hover:text-white"
            }
          >
            {group.name} {group.member_count ? `(${group.member_count})` : ""}
          </Button>
        ))}
      </div>
    </div>
  );
}
