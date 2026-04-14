import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useAuth } from "@/contexts/AuthContext";
import { useUserGroupsQuery } from "@/hooks/queries/groups/useUserGroups";
import { useUserPermissionsQuery } from "@/hooks/queries/auth/useUserPermissions";
import { useDeleteGroupMutation } from "@/hooks/queries/groups/useDeleteGroup";
import { DeleteGroupDialog } from "./Groups/DeleteGroupDialog";
import { CreateGroupDialog } from "./Groups/CreateGroupDialog";
import { SignInRequired } from "./Groups/SignInRequired";
import { GroupsHeader } from "./Groups/GroupsHeader";
import { MyGroupsList } from "./Groups/MyGroupsList";
import { Button } from "@/components/ui/button";

function Groups() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [showAllGroups, setShowAllGroups] = useState(false);

  const { data: isAdmin = false } = useUserPermissionsQuery(
    user?.id,
    "is_admin",
  );
  const { data: groups = [], isLoading: groupsLoading } = useUserGroupsQuery(
    user?.id,
    { all: showAllGroups },
  );
  const deleteGroupMutation = useDeleteGroupMutation();
  const loading = authLoading || groupsLoading;
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
    if (!groupToDelete || !user) return;

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

  if (!user) {
    return <SignInRequired />;
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

        <MyGroupsList
          groups={groups}
          loading={loading}
          onDelete={handleDeleteGroup}
          showMembershipBadges={showAllGroups}
        />

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

export default Groups;
