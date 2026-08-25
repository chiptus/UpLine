import { User } from "@supabase/supabase-js";
import { LogOut, Settings, User as UserIcon } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { UserAvatar } from "./UserAvatar";
import { Database } from "@/integrations/supabase/types";
import { Link } from "@tanstack/react-router";
import { useUserPermissionsQuery } from "@/api/auth/useUserPermissions";

type Profile = Database["public"]["Tables"]["profiles"]["Row"];

interface UserMenuProps {
  user: User;
  profile?: Profile | undefined;
  onSignOut: () => void;
  isMobile?: boolean;
}

export function UserMenu({
  user,
  profile,
  onSignOut,
  isMobile,
}: UserMenuProps) {
  const displayName = profile?.username || user.email?.split("@")[0] || "User";

  const { data: isAdmin = false } = useUserPermissionsQuery(
    user.id,
    "is_admin",
  );

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size={isMobile ? "sm" : "default"}
          aria-label="User menu"
          className="flex items-center gap-2 rounded-full transition-colors"
        >
          <UserAvatar
            username={profile?.username}
            email={user.email}
            size={isMobile ? "sm" : "md"}
          />
          {!isMobile && (
            <span className="text-foreground font-medium">{displayName}</span>
          )}
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-56" sideOffset={8}>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{displayName}</p>
            <p className="text-xs leading-none text-muted-foreground">
              {user.email}
            </p>
          </div>
        </DropdownMenuLabel>

        <DropdownMenuSeparator />

        <DropdownMenuItem className="cursor-pointer" disabled>
          <UserIcon className="mr-2 h-4 w-4" />
          <span>Profile</span>
        </DropdownMenuItem>

        <DropdownMenuItem asChild className="cursor-pointer">
          <Link to="/settings">
            <Settings className="mr-2 h-4 w-4" />
            <span>Settings</span>
          </Link>
        </DropdownMenuItem>

        {isAdmin && (
          <>
            <DropdownMenuSeparator />

            <DropdownMenuItem asChild className="cursor-pointer">
              <Link to="/admin">
                <Settings className="h-4 w-4 mr-2" />
                Admin Dashboard
              </Link>
            </DropdownMenuItem>
          </>
        )}

        <DropdownMenuSeparator />

        <DropdownMenuItem
          onClick={onSignOut}
          className="text-destructive focus:bg-destructive focus:text-destructive-foreground cursor-pointer"
        >
          <LogOut className="mr-2 h-4 w-4" />
          <span>Sign out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
