import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "@tanstack/react-router";
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
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/components/ui/use-toast";
import { InviteManagement } from "./GroupDetail/InviteManagement";
import { AddMemberForm } from "./GroupDetail/AddMemberForm";
import { Button } from "@/components/ui/button";
import { useGroupBySlugQuery } from "@/api/groups/useGroupBySlug";
import { useGroupMembersQuery } from "@/api/groups/useGroupMembers";
import { useRemoveMemberMutation } from "@/api/groups/useRemoveMember";

function GroupDetail() {
  const { groupSlug } = useParams({ from: "/groups/$groupSlug" });
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const [removingMember, setRemovingMember] = useState<string | null>(null);

  // React Query hooks
  const {
    data: group,
    isLoading: groupLoading,
    error: groupError,
  } = useGroupBySlugQuery({ slug: groupSlug, userId: user?.id });
  const { data: members = [], isLoading: membersLoading } =
    useGroupMembersQuery(group?.id || "");
  const removeMemberMutation = useRemoveMemberMutation(group?.id || "");

  const loading = groupLoading || membersLoading;

  useEffect(() => {
    if (authLoading) return; // Wait for auth to load

    if (!groupSlug) {
      navigate({ to: "/groups" });
      return;
    }

    if (!user) {
      navigate({ to: "/" }); // Redirect to home to sign in
      return;
    }

    // Handle group fetch errors
    if (groupError) {
      toast({
        title: "Error",
        description: "Failed to fetch group details",
        variant: "destructive",
      });
      navigate({ to: "/groups" });
    }
  }, [groupSlug, user, authLoading, groupError, navigate, toast]);

  // Show loading while checking authentication
  if (authLoading) {
    return (
      <div className="min-h-screen bg-app-gradient flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

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

  if (loading) {
    return (
      <div className="min-h-screen bg-app-gradient flex items-center justify-center">
        <div className="text-white text-xl">Loading group details...</div>
      </div>
    );
  }

  if (!group) {
    return (
      <div className="min-h-screen bg-app-gradient flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Group not found</CardTitle>
            <CardDescription>
              The group you're looking for doesn't exist or you don't have
              access to it
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full">
              <Link to="/groups">Back to Groups</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const isCreator = group.created_by === user.id;

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
                    const isMemberCreator = member.role === "creator";
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
                              handleRemoveMember(member.id, member.user_id)
                            }
                            disabled={removingMember === member.id}
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

  async function handleRemoveMember(memberId: string, memberUserId: string) {
    if (!group?.id || !user) return;

    if (
      window.confirm(
        "Are you sure you want to remove this member from the group?",
      )
    ) {
      setRemovingMember(memberId);
      try {
        await removeMemberMutation.mutateAsync({
          userId: memberUserId,
          currentUserId: user.id,
        });
        // The mutation automatically invalidates queries and shows toast
      } finally {
        setRemovingMember(null);
      }
    }
  }
}

export default GroupDetail;
