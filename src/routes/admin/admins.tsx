import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useSuspenseQuery } from "@tanstack/react-query";
import { adminRolesQuery } from "@/api/admin-roles/useAdminRolesQuery";
import { useAddAdminMutation } from "@/api/admin-roles/useAddAdminMutation";
import { useRemoveAdminMutation } from "@/api/admin-roles/useRemoveAdminMutation";
import { useUpdateAdminRoleMutation } from "@/api/admin-roles/useUpdateAdminRoleMutation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { UserPlus, Trash2, Crown } from "lucide-react";
import type { Database } from "@/integrations/supabase/types";
import { pageMeta } from "@/lib/pageHead";

export const Route = createFileRoute("/admin/admins")({
  component: AdminRolesTable,
  head: () => ({
    meta: pageMeta({ title: "Admins", prefix: "Admin" }),
  }),
  loader: async ({ context }) => {
    await context.queryClient.ensureQueryData(adminRolesQuery());
  },
});

function AdminRolesTable() {
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [newUserEmail, setNewUserEmail] = useState("");
  const [newUserRole, setNewUserRole] =
    useState<Database["public"]["Enums"]["admin_role"]>("moderator");

  const { data: adminRoles } = useSuspenseQuery(adminRolesQuery());
  const addAdminMutation = useAddAdminMutation();
  const removeAdminMutation = useRemoveAdminMutation();
  const updateRoleMutation = useUpdateAdminRoleMutation();

  async function handleAddAdmin(e: React.FormEvent) {
    e.preventDefault();

    addAdminMutation.mutate(
      {
        email: newUserEmail,
        role: newUserRole,
      },
      {
        onSuccess: () => {
          setNewUserEmail("");
          setNewUserRole("moderator");
          setAddDialogOpen(false);
        },
      },
    );
  }

  function handleRemoveAdmin(roleId: string) {
    removeAdminMutation.mutate(roleId);
  }

  function handleRoleChange(
    roleId: string,
    newRole: Database["public"]["Enums"]["admin_role"],
  ) {
    updateRoleMutation.mutate({ roleId, newRole });
  }

  function getRoleBadgeVariant(role: string) {
    switch (role) {
      case "super_admin":
        return "default";
      case "admin":
        return "secondary";
      case "moderator":
        return "outline";
      default:
        return "outline";
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Crown className="h-5 w-5" />
              Admin Roles Management
            </CardTitle>
            <CardDescription>
              Manage admin roles and permissions for the platform
            </CardDescription>
          </div>
          <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <UserPlus className="h-4 w-4 mr-2" />
                Add Admin
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Admin</DialogTitle>
                <DialogDescription>
                  Add a new admin role by entering the user's email address
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleAddAdmin} className="space-y-4">
                <div>
                  <Label htmlFor="user-email">User Email</Label>
                  <Input
                    id="user-email"
                    type="email"
                    value={newUserEmail}
                    onChange={(e) => setNewUserEmail(e.target.value)}
                    placeholder="user@example.com"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="admin-role">Admin Role</Label>
                  <Select
                    value={newUserRole}
                    onValueChange={(
                      value: Database["public"]["Enums"]["admin_role"],
                    ) => setNewUserRole(value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="moderator">Moderator</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button
                  type="submit"
                  className="w-full"
                  disabled={addAdminMutation.isPending}
                >
                  {addAdminMutation.isPending ? "Adding Admin..." : "Add Admin"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {adminRoles.map((adminRole) => (
              <TableRow key={adminRole.id}>
                <TableCell className="font-medium">
                  {adminRole.profile?.username || "No username"}
                </TableCell>
                <TableCell>{adminRole.profile?.email}</TableCell>
                <TableCell>
                  {adminRole.role === "super_admin" ? (
                    <Badge variant={getRoleBadgeVariant(adminRole.role)}>
                      {adminRole.role.replace("_", " ")}
                    </Badge>
                  ) : (
                    <Select
                      value={adminRole.role}
                      onValueChange={(
                        value: Database["public"]["Enums"]["admin_role"],
                      ) => handleRoleChange(adminRole.id, value)}
                    >
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="moderator">Moderator</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                </TableCell>
                <TableCell>
                  {new Date(adminRole.created_at).toLocaleDateString()}
                </TableCell>
                <TableCell className="text-right">
                  {adminRole.role !== "super_admin" && (
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="outline" size="sm">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Remove Admin Role</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to remove the admin role from{" "}
                            {adminRole.profile?.username ||
                              adminRole.profile?.email}
                            ? This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleRemoveAdmin(adminRole.id)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            Remove
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {adminRoles.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            No admin roles found
          </div>
        )}
      </CardContent>
    </Card>
  );
}
