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
            className="border-purple-400 text-purple-400 hover:bg-purple-400 hover:text-white"
          >
            <Menu className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="end"
          className="bg-gray-800 border-purple-400/20 text-white"
        >
          <DropdownMenuLabel className="text-purple-300">
            Admin Actions
          </DropdownMenuLabel>
          <DropdownMenuSeparator className="bg-purple-400/20" />

          <DropdownMenuItem
            asChild
            className="text-white hover:bg-purple-600 focus:bg-purple-600 cursor-pointer"
          >
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
