import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { useUserGroupsQuery } from "@/api/groups/useUserGroups";
import { useGroupVotesQuery } from "@/api/voting/useGroupVotes";
import { Users } from "lucide-react";
import { VOTE_CONFIG, VOTES_TYPES, getVoteConfig } from "@/lib/votes/config";
import { tallyVotes } from "@/lib/votes/score";
import { cn } from "@/lib/utils";

interface SetGroupVotingProps {
  setId: string;
}

export function SetGroupVoting({ setId: artistId }: SetGroupVotingProps) {
  const { user } = useAuth();
  const { data: groups = [] } = useUserGroupsQuery(user?.id);
  const [selectedGroupId, setSelectedGroupId] = useState<string>("");

  // Set default group when groups load
  useEffect(() => {
    if (groups.length > 0 && !selectedGroupId) {
      setSelectedGroupId(groups[0].id);
    }
  }, [groups, selectedGroupId]);

  // Use React Query to fetch group votes
  const { data: groupVotes = [], isLoading: loading } = useGroupVotesQuery(
    artistId,
    selectedGroupId,
  );

  // Don't show if user has no groups
  if (!user || groups.length === 0) {
    return null;
  }

  const { counts } = tallyVotes(groupVotes);

  const selectedGroup = groups.find((g) => g.id === selectedGroupId);

  return (
    <Card className="bg-white/10 backdrop-blur-md border-purple-400/30">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-white flex items-center gap-2">
            <Users className="h-5 w-5" />
            Group Voting
          </CardTitle>
          {groups.length > 1 && (
            <Select value={selectedGroupId} onValueChange={setSelectedGroupId}>
              <SelectTrigger className="w-48 bg-white/5 border-purple-400/30 text-white">
                <SelectValue placeholder="Select group" />
              </SelectTrigger>
              <SelectContent>
                {groups.map((group) => (
                  <SelectItem key={group.id} value={group.id}>
                    {group.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
        {selectedGroup && (
          <p className="text-purple-200 text-sm">
            How {selectedGroup.name} voted on this artist
          </p>
        )}
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="text-center py-4 text-purple-200">
            Loading votes...
          </div>
        ) : groupVotes.length === 0 ? (
          <div className="text-center py-4 text-purple-200">
            No one in this group has voted on this artist yet.
          </div>
        ) : (
          <div className="space-y-4">
            {/* Vote Summary */}
            <div className="grid grid-cols-3 gap-4">
              {VOTES_TYPES.map((voteTypeKey) => {
                const config = VOTE_CONFIG[voteTypeKey];
                const voteType = config.value;
                const IconComponent = config.icon;
                return (
                  <div className="flex flex-col items-center" key={voteType}>
                    <div
                      key={voteType}
                      className={cn(
                        "flex items-center justify-center flex-col rounded-md size-24",
                        config.bgColor,
                        config.textColor,
                      )}
                    >
                      <div className="flex items-center justify-center gap-2 mb-1">
                        <IconComponent
                          className={`h-4 w-4 ${config.iconColor}`}
                        />
                        <span className="font-semibold">
                          {counts[voteTypeKey]}
                        </span>
                      </div>
                      <p className={`text-sm`}>{config.label}</p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Individual Votes */}
            <div className="space-y-2">
              <h4 className="text-white font-medium text-sm mb-2">
                Individual Votes:
              </h4>
              {groupVotes.map((vote) => {
                const configKey = getVoteConfig(vote.vote_type);
                const config = configKey ? VOTE_CONFIG[configKey] : null;
                return (
                  <div
                    key={vote.user_id}
                    className="flex items-center justify-between py-2 px-3 rounded-lg bg-white/5"
                  >
                    <span className="text-purple-200">
                      {vote.username || "Unknown User"}
                    </span>
                    <Badge
                      className={`${config?.bgColor} ${config?.textColor} border-transparent flex items-center gap-1`}
                    >
                      {config && <config.icon className="h-3 w-3" />}
                      {config?.label}
                    </Badge>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
