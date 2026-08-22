import { useSuspenseQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { useActiveScope } from "@/contexts/ActiveScopeContext";
import { userGroupsQuery } from "@/api/groups/useUserGroups";
import { useGroupVotesQuery } from "@/api/voting/useGroupVotes";
import { Users } from "lucide-react";
import { VOTE_CONFIG, VOTES_TYPES, getVoteConfig } from "@/lib/voteConfig";
import { cn } from "@/lib/utils";

interface SetGroupVotingProps {
  setId: string;
}

export function SetGroupVoting({ setId: artistId }: SetGroupVotingProps) {
  const { user } = useAuth();

  if (!user) {
    return null;
  }

  return <SetGroupVotingContent artistId={artistId} userId={user.id} />;
}

function SetGroupVotingContent({
  artistId,
  userId,
}: {
  artistId: string;
  userId: string;
}) {
  const { data: groups } = useSuspenseQuery(userGroupsQuery(userId));
  const { current } = useActiveScope();
  const activeGroupId = current.kind === "group" ? current.groupId : undefined;

  // Use React Query to fetch group votes
  const { data: groupVotes = [], isLoading: loading } = useGroupVotesQuery(
    artistId,
    activeGroupId ?? "",
  );

  // Don't show if user has no groups or no active group
  if (groups.length === 0 || !activeGroupId) {
    return null;
  }

  const voteCounts = {
    2: groupVotes.filter((vote) => vote.vote_type === 2).length,
    1: groupVotes.filter((vote) => vote.vote_type === 1).length,
    [-1]: groupVotes.filter((vote) => vote.vote_type === -1).length,
  };

  const activeGroup = groups.find((g) => g.id === activeGroupId);

  return (
    <Card className="bg-surface-raised backdrop-blur-md border">
      <CardHeader>
        <CardTitle className="text-foreground flex items-center gap-2">
          <Users className="h-5 w-5" />
          Group Voting
        </CardTitle>
        {activeGroup && (
          <p className="text-muted-foreground text-sm">
            How {activeGroup.name} voted on this artist
          </p>
        )}
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="text-center py-4 text-muted-foreground">
            Loading votes...
          </div>
        ) : groupVotes.length === 0 ? (
          <div className="text-center py-4 text-muted-foreground">
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
                          {voteCounts[voteType as keyof typeof voteCounts]}
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
              <h4 className="text-foreground font-medium text-sm mb-2">
                Individual Votes:
              </h4>
              {groupVotes.map((vote) => {
                const configKey = getVoteConfig(vote.vote_type);
                const config = configKey ? VOTE_CONFIG[configKey] : null;
                return (
                  <div
                    key={vote.user_id}
                    className="flex items-center justify-between py-2 px-3 rounded-lg bg-surface"
                  >
                    <span className="text-muted-foreground">
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
