import { createFileRoute } from "@tanstack/react-router";
import { groupBySlugQuery } from "@/api/groups/useGroupBySlug";
import { groupMembersQuery } from "@/api/groups/useGroupMembers";
import { groupInvitesQuery } from "@/api/invites/useGroupInvites";
import { useState } from "react";
import { useParams, useRouteContext, Link } from "@tanstack/react-router";
import type { User } from "@supabase/supabase-js";
import { useSuspenseQuery } from "@tanstack/react-query";
import { TopBar } from "@/components/layout/TopBar";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, UserMinus, Crown } from "lucide-react";
import { InviteManagement } from "@/pages/groups/GroupDetail/InviteManagement";
import { AddMemberForm } from "@/pages/groups/GroupDetail/AddMemberForm";
import { Button } from "@/components/ui/button";
import { confirm } from "@/hooks/use-confirm";
import { useRemoveMemberMutation } from "@/api/groups/useRemoveMember";
import { isGroupCreator } from "@/lib/groupPermissions";
import { pageMeta } from "@/lib/pageHead";

export const Route = createFileRoute("/groups/$groupSlug")({
  component: GroupDetail,
  loader: async ({ params, context }) => {
    if (!context.user) return { group: undefined };

    const group = await context.queryClient.ensureQueryData(
      groupBySlugQuery(params.groupSlug, context.user.id),
    );
    void context.queryClient.ensureQueryData(groupMembersQuery(group.id));

    if (group.created_by === context.user.id) {
      void context.queryClient.ensureQueryData(groupInvitesQuery(group.id));
    }

    return { group };
  },
  head: ({ loaderData }) => ({
    meta: pageMeta({ title: loaderData?.group?.name ?? "Sign in required" }),
  }),
});

function GroupDetail() {
  const { user } = useRouteContext({ from: "/groups/$groupSlug" });

  if (!user) {
    return (
      <div className="min-h-screen bg-app-gradient flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Sign in required</CardTitle>
            <CardDescription>
              Please sign in to view group details
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full">
              <Link to="/">Go to Home</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <GroupDetailContent user={user} />;
}

function GroupDetailContent({ user }: { user: User }) {
  const { groupSlug } = useParams({ from: "/groups/$groupSlug" });
  const [removingMemberId, setRemovingMemberId] = useState<string | null>(null);

  const { data: group } = useSuspenseQuery(
    groupBySlugQuery(groupSlug, user.id),
  );
  const { data: members } = useSuspenseQuery(groupMembersQuery(group.id));
  const removeMemberMutation = useRemoveMemberMutation(group.id);

  const isCreator = isGroupCreator(group.created_by, user.id);

  return (
    <div className="min-h-screen bg-app-gradient">
      <div className="container mx-auto px-4 py-8">
        <TopBar showBackButton backLabel="Back to Groups" />

        <div className="mb-8">
          <div className="flex items-center space-x-4 mb-2">
            <h2 className="text-4xl font-bold text-white">{group.name}</h2>
            {isCreator && (
              <div className="flex items-center space-x-1 bg-purple-600/50 text-purple-100 px-2 py-1 rounded text-sm">
                <Crown className="h-3 w-3" />
                <span>Creator</span>
              </div>
            )}
          </div>
          {group.description && (
            <p className="text-purple-200 text-lg">{group.description}</p>
          )}
        </div>

        <Tabs defaultValue="members" className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-white/10">
            <TabsTrigger
              value="members"
              className="text-white data-[state=active]:bg-purple-600"
            >
              Members
            </TabsTrigger>
            <TabsTrigger
              value="invites"
              className="text-white data-[state=active]:bg-purple-600"
              disabled={!isCreator}
            >
              Invite Links
            </TabsTrigger>
          </TabsList>

          <TabsContent value="members" className="space-y-4">
            {/* Member Invitation Form - Only show for creators */}
            {isCreator && <AddMemberForm groupId={group.id} />}

            <Card className="bg-white/10 border-purple-400/30">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center space-x-2 text-white">
                      <Users className="h-5 w-5" />
                      <span>Group Members ({members.length})</span>
                    </CardTitle>
                    <CardDescription className="text-purple-200">
                      {isCreator
                        ? "Manage your group members"
                        : "View group members"}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {members.map((member) => {
                    const isCurrentUser = member.user_id === user.id;
                    const isMemberCreator = isGroupCreator(
                      group.created_by,
                      member.user_id,
                    );
                    const profile = member.profiles;

                    return (
                      <div
                        key={member.id}
                        className="flex items-center justify-between p-3 bg-white/5 rounded-lg"
                      >
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center text-white font-medium">
                            {profile?.username?.[0]?.toUpperCase() ||
                              profile?.email?.[0]?.toUpperCase() ||
                              "?"}
                          </div>
                          <div>
                            <div className="flex items-center space-x-2">
                              <span className="text-white font-medium">
                                {profile?.username ||
                                  profile?.email ||
                                  "Unknown User"}
                                {isCurrentUser && " (You)"}
                              </span>
                              {isMemberCreator && (
                                <div className="flex items-center space-x-1 bg-purple-600/50 text-purple-100 px-2 py-1 rounded text-xs">
                                  <Crown className="h-3 w-3" />
                                  <span>Creator</span>
                                </div>
                              )}
                            </div>
                            <p className="text-sm text-purple-200">
                              Joined{" "}
                              {new Date(member.joined_at).toLocaleDateString()}
                            </p>
                          </div>
                        </div>

                        {isCreator && !isCurrentUser && !isMemberCreator && (
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() =>
                              handleRemoveMemberRequest(
                                member.id,
                                member.user_id,
                              )
                            }
                            disabled={removingMemberId === member.id}
                          >
                            <UserMinus className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    );
                  })}

                  {members.length === 0 && (
                    <div className="text-center py-8 text-purple-200">
                      No members found
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {isCreator && (
            <TabsContent value="invites" className="space-y-4">
              <InviteManagement groupId={group.id} groupName={group.name} />
            </TabsContent>
          )}
        </Tabs>
      </div>
    </div>
  );

  async function handleRemoveMemberRequest(
    memberId: string,
    memberUserId: string,
  ) {
    const confirmed = await confirm({
      title: "Remove this member?",
      description:
        "Are you sure you want to remove this member from the group?",
      confirmLabel: "Remove",
    });
    if (!confirmed) return;

    setRemovingMemberId(memberId);
    removeMemberMutation.mutate(
      { userId: memberUserId, currentUserId: user.id },
      { onSettled: () => setRemovingMemberId(null) },
    );
  }
}
