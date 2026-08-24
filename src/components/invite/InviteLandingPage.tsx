import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, UserPlus, AlertCircle } from "lucide-react";
import { AuthDialog } from "@/components/AuthDialog/AuthDialog";
import { useState } from "react";
import type { InviteValidation } from "@/types/invites";

interface InviteLandingPageProps {
  inviteValidation: InviteValidation;
  inviteToken: string;
}

export function InviteLandingPage({
  inviteValidation,
  inviteToken,
}: InviteLandingPageProps) {
  const [showAuthDialog, setShowAuthDialog] = useState(false);

  if (!inviteValidation.is_valid) {
    return (
      <div className="app-view min-h-screen bg-ground flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <AlertCircle className="h-12 w-12 mx-auto mb-4 text-red-500" />
            <CardTitle className="text-red-600">Invalid Invite</CardTitle>
            <CardDescription>
              This invite link is no longer valid or has expired.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="app-view min-h-screen bg-ground flex items-center justify-center p-4">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          <Users className="h-12 w-12 mx-auto mb-4 text-purple-400" />
          <CardTitle>You're Invited!</CardTitle>
          <CardDescription>
            You've been invited to join the group:
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-purple-600 mb-2">
              {inviteValidation.group_name}
            </h2>
            <p className="text-muted-foreground">
              Create an account to join this group and start voting for your
              favorite festival artists!
            </p>
          </div>

          <Button
            onClick={() => setShowAuthDialog(true)}
            className="w-full bg-purple-600 hover:bg-purple-700"
            size="lg"
          >
            <UserPlus className="h-5 w-5 mr-2" />
            Join Group
          </Button>
        </CardContent>
      </Card>

      <AuthDialog
        open={showAuthDialog}
        onOpenChange={setShowAuthDialog}
        onSuccess={() => setShowAuthDialog(false)}
        inviteToken={inviteToken}
        groupName={inviteValidation.group_name}
      />
    </div>
  );
}
