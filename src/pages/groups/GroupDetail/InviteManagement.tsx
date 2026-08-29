import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { confirm } from "@/hooks/use-confirm";
import { Link, Copy, Trash2, Calendar, Users } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { useSuspenseQuery } from "@tanstack/react-query";
import { groupInvitesQuery } from "@/api/invites/useGroupInvites";
import { useGenerateInviteMutation } from "@/api/invites/useGenerateInviteMutation";
import { useDeleteInviteMutation } from "@/api/invites/useDeleteInviteMutation";
import { GroupInvite } from "@/api/invites/types";

interface InviteManagementProps {
  groupId: string;
  groupName: string;
}

export function InviteManagement({
  groupId,
  groupName,
}: InviteManagementProps) {
  const [expirationDays, setExpirationDays] = useState<string>("");
  const [maxUses, setMaxUses] = useState<string>("");

  const { toast } = useToast();

  // React Query hooks
  const { data: invites } = useSuspenseQuery(groupInvitesQuery(groupId));
  const generateInviteMutation = useGenerateInviteMutation(groupId);
  const deleteInviteMutation = useDeleteInviteMutation(groupId);

  function generateInvite() {
    const options: {
      expiresAt?: Date;
      maxUses?: number;
    } = {};

    if (expirationDays) {
      const expireDate = new Date();
      expireDate.setDate(expireDate.getDate() + parseInt(expirationDays));
      options.expiresAt = expireDate;
    }

    if (maxUses) {
      options.maxUses = parseInt(maxUses);
    }

    generateInviteMutation.mutate(options, {
      onSuccess: () => {
        // Reset form
        setExpirationDays("");
        setMaxUses("");
      },
    });
  }

  async function copyInviteLink(token: string) {
    const inviteUrl = `${window.location.origin}/?invite=${token}`;
    try {
      await navigator.clipboard.writeText(inviteUrl);
      toast({
        title: "Copied!",
        description: "Invite link copied to clipboard",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to copy link",
        variant: "destructive",
      });
      console.error("Failed to copy link", error);
    }
  }

  async function handleDeleteInviteRequest(inviteId: string) {
    const confirmed = await confirm({
      title: "Delete this invite?",
      description:
        "Are you sure you want to delete this invite? This action cannot be undone.",
      confirmLabel: "Delete",
    });
    if (!confirmed) return;

    deleteInviteMutation.mutate(inviteId);
  }

  function formatDate(dateString: string) {
    return new Date(dateString).toLocaleDateString();
  }

  function isExpired(expiresAt?: string) {
    if (!expiresAt) return false;
    return new Date(expiresAt) <= new Date();
  }

  function isOverused(invite: GroupInvite) {
    return (
      invite.max_uses !== undefined && invite.used_count >= invite.max_uses
    );
  }

  return (
    <div className="space-y-6">
      {/* Generate New Invite */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Link className="h-5 w-5" />
            <span>Generate Invite Link</span>
          </CardTitle>
          <CardDescription>
            Create a new invite link for {groupName}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="expiration">Expires in (days)</Label>
              <Input
                id="expiration"
                type="number"
                placeholder="Leave empty for no expiration"
                value={expirationDays}
                onChange={(e) => setExpirationDays(e.target.value)}
                min="1"
              />
            </div>
            <div>
              <Label htmlFor="maxUses">Max uses</Label>
              <Input
                id="maxUses"
                type="number"
                placeholder="Leave empty for unlimited"
                value={maxUses}
                onChange={(e) => setMaxUses(e.target.value)}
                min="1"
              />
            </div>
          </div>
          <Button
            onClick={generateInvite}
            disabled={generateInviteMutation.isPending}
            className="w-full"
          >
            {generateInviteMutation.isPending
              ? "Generating..."
              : "Generate Invite Link"}
          </Button>
        </CardContent>
      </Card>

      {/* Active Invites */}
      <Card>
        <CardHeader>
          <CardTitle>Active Invites</CardTitle>
          <CardDescription>Manage your group's invite links</CardDescription>
        </CardHeader>
        <CardContent>
          {invites.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No active invites. Generate one above to get started.
            </p>
          ) : (
            <div className="space-y-4">
              {invites.map((invite) => (
                <div key={invite.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <Badge
                        variant={
                          !invite.is_active
                            ? "destructive"
                            : isExpired(invite.expires_at)
                              ? "destructive"
                              : isOverused(invite)
                                ? "destructive"
                                : "default"
                        }
                      >
                        {!invite.is_active
                          ? "Inactive"
                          : isExpired(invite.expires_at)
                            ? "Expired"
                            : isOverused(invite)
                              ? "Overused"
                              : "Active"}
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        Created {formatDate(invite.created_at)}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => copyInviteLink(invite.invite_token)}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDeleteInviteRequest(invite.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                    <div className="flex items-center space-x-1">
                      <Users className="h-4 w-4" />
                      <span>{invite.used_count} uses</span>
                      {invite.max_uses && <span>/ {invite.max_uses}</span>}
                    </div>
                    {invite.expires_at && (
                      <div className="flex items-center space-x-1">
                        <Calendar className="h-4 w-4" />
                        <span>Expires {formatDate(invite.expires_at)}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
