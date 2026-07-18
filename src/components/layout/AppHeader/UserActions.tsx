import { Button } from "@/components/ui/button";
import { LogIn } from "lucide-react";
import { Navigation } from "./Navigation";
import { UserMenu } from "./UserMenu";
import { useAuth } from "@/contexts/AuthContext";

interface UserActionsProps {
  showBackButton?: boolean;
  backLabel?: string;
  showGroupsButton?: boolean;
  isMobile: boolean;
}

export function UserActions({
  showBackButton = false,
  backLabel = "Back",
  showGroupsButton = false,
  isMobile,
}: UserActionsProps) {
  const { user, profile, signOut, showAuthDialog } = useAuth();

  return (
    <div className="flex items-center gap-4 justify-end flex-1">
      <Navigation
        showBackButton={showBackButton}
        backLabel={backLabel}
        showGroupsButton={showGroupsButton}
        isMobile={isMobile}
      />

      <div className="flex items-center">
        {user ? (
          <UserMenu
            user={user}
            profile={profile || undefined}
            onSignOut={signOut}
            isMobile={isMobile}
          />
        ) : (
          <Button
            onClick={() => showAuthDialog()}
            size={isMobile ? "sm" : "default"}
            className="bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-full px-6"
          >
            <LogIn className="h-4 w-4" />
            <span className={isMobile ? "ml-1" : "ml-2"}>
              {isMobile ? "Sign In" : "Sign In / Sign Up"}
            </span>
          </Button>
        )}
      </div>
    </div>
  );
}
