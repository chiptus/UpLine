import { Menu, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "@tanstack/react-router";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useUserPermissionsQuery } from "@/api/auth/useUserPermissions";

export function AdminActions({
  isMobile,
  userId,
}: {
  isMobile: boolean;
  userId: string | undefined;
}) {
  const { data: canEdit = false } = useUserPermissionsQuery(
    userId,
    "edit_artists",
  );

  if (!canEdit) {
    return null;
  }

  if (isMobile) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className="border-ring text-ring hover:bg-ring hover:text-foreground"
          >
            <Menu className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel className="text-muted-foreground">
            Admin Actions
          </DropdownMenuLabel>
          <DropdownMenuSeparator />

          <DropdownMenuItem asChild className="cursor-pointer">
            <Link to="/admin">
              <Settings className="h-4 w-4 mr-2" />
              Admin Dashboard
            </Link>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Button
        size="sm"
        asChild
        className="bg-orange-600 hover:bg-orange-700 text-white font-medium"
      >
        <Link to="/admin">
          <Settings className="h-4 w-4 mr-2" />
          Admin
        </Link>
      </Button>
    </div>
  );
}
