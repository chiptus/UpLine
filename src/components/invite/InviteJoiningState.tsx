import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle, Loader2 } from "lucide-react";
import { InviteStatusScreen } from "@/components/invite/InviteStatusScreen";

interface InviteJoiningStateProps {
  groupName: string | undefined;
  isPending: boolean;
  error: Error | null;
  onRetry: () => void;
  onContinue: () => void;
}

export function InviteJoiningState({
  groupName,
  isPending,
  error,
  onRetry,
  onContinue,
}: InviteJoiningStateProps) {
  if (isPending) {
    return (
      <InviteStatusScreen>
        <Loader2 className="h-10 w-10 mx-auto mb-4 text-purple-400 animate-spin" />
        <p className="text-white">Joining {groupName || "the group"}...</p>
      </InviteStatusScreen>
    );
  }

  return (
    <InviteStatusScreen>
      <Card className="max-w-md w-full mx-auto">
        <CardHeader className="text-center">
          <AlertCircle className="h-12 w-12 mx-auto mb-4 text-red-500" />
          <CardTitle className="text-red-600">Couldn't join group</CardTitle>
          <CardDescription>
            {error?.message || "Something went wrong."}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          <Button onClick={onRetry}>Try again</Button>
          <Button variant="outline" onClick={onContinue}>
            Continue to app
          </Button>
        </CardContent>
      </Card>
    </InviteStatusScreen>
  );
}
