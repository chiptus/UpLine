import { Suspense, useState } from "react";
import { useNavigate, useRouteContext } from "@tanstack/react-router";
import type { User } from "@supabase/supabase-js";
import { useSuspenseQuery } from "@tanstack/react-query";
import { userGroupsQuery } from "@/api/groups/useUserGroups";
import { useUserPermissionsQuery } from "@/api/auth/useUserPermissions";
import { useDeleteGroupMutation } from "@/api/groups/useDeleteGroup";
import { DeleteGroupDialog } from "./Groups/DeleteGroupDialog";
import { CreateGroupDialog } from "./Groups/CreateGroupDialog";
import { SignInRequired } from "./Groups/SignInRequired";
import { GroupsHeader } from "./Groups/GroupsHeader";
import { MyGroupsList } from "./Groups/MyGroupsList";
import { Button } from "@/components/ui/button";

function Groups() {
  const { user } = useRouteContext({ from: "/groups/" });

  if (!user) {
    return <SignInRequired />;
  }

  return <GroupsContent user={user} />;
}

function GroupsContent({ user }: { user: User }) {
  const navigate = useNavigate();
  const [showAllGroups, setShowAllGroups] = useState(false);

  const { data: isAdmin = false } = useUserPermissionsQuery(
    user.id,
    "is_admin",
  );
  const deleteGroupMutation = useDeleteGroupMutation();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [groupToDelete, setGroupToDelete] = useState<{
    id: string;
    name: string;
  } | null>(null);

  function handleDeleteGroup(groupId: string, groupName: string) {
    setGroupToDelete({ id: groupId, name: groupName });
    setDeleteDialogOpen(true);
  }

  function confirmDeleteGroup() {
    if (!groupToDelete) return;

    deleteGroupMutation.mutate(
      {
        groupId: groupToDelete.id,
        userId: user.id,
      },
      {
        onSettled: () => {
          setDeleteDialogOpen(false);
          setGroupToDelete(null);
        },
      },
    );
    // The mutation automatically handles success/error toasts
  }

  return (
    <div className="min-h-screen bg-app-gradient">
      <div className="container mx-auto px-4 py-8">
        <GroupsHeader onCreate={() => setCreateDialogOpen(true)} />

        {isAdmin && (
          <div className="mb-6 flex gap-2">
            <Button
              variant={!showAllGroups ? "default" : "outline"}
              onClick={() => setShowAllGroups(false)}
              className="text-sm"
            >
              My Groups
            </Button>
            <Button
              variant={showAllGroups ? "default" : "outline"}
              onClick={() => setShowAllGroups(true)}
              className="text-sm"
            >
              All Groups
            </Button>
          </div>
        )}

        <Suspense
          fallback={
            <div className="text-center text-white">Loading groups...</div>
          }
        >
          <GroupsList
            userId={user.id}
            showAllGroups={showAllGroups}
            onDelete={handleDeleteGroup}
          />
        </Suspense>

        <CreateGroupDialog
          isOpen={createDialogOpen}
          onOpenChange={setCreateDialogOpen}
          onGroupCreated={(groupSlug) => {
            navigate({ to: "/groups/$groupSlug", params: { groupSlug } });
            setCreateDialogOpen(false);
          }}
        />
        <DeleteGroupDialog
          isOpen={deleteDialogOpen}
          onClose={() => {
            setDeleteDialogOpen(false);
            setGroupToDelete(null);
          }}
          onConfirm={confirmDeleteGroup}
          groupName={groupToDelete?.name || ""}
          isDeleting={deleteGroupMutation.isPending}
        />
      </div>
    </div>
  );
}

function GroupsList({
  userId,
  showAllGroups,
  onDelete,
}: {
  userId: string;
  showAllGroups: boolean;
  onDelete: (id: string, name: string) => void;
}) {
  const { data: groups } = useSuspenseQuery(
    userGroupsQuery(userId, { all: showAllGroups }),
  );

  return (
    <MyGroupsList
      groups={groups}
      loading={false}
      onDelete={onDelete}
      showMembershipBadges={showAllGroups}
    />
  );
}

export default Groups;
