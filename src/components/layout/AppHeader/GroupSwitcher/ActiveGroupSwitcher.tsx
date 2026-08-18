import { ChevronDown, Settings } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useActiveScope } from "@/contexts/ActiveScopeContext";
import { scopeIcon, scopeLabel } from "./scopeDisplay";
import { ScopeMenuBody } from "./ScopeMenuBody";
import type { Group } from "@/api/groups/types";

interface ActiveGroupSwitcherProps {
  groups: Group[];
  isMobile: boolean;
  className: string;
}

export function ActiveGroupSwitcher({
  groups,
  isMobile,
  className,
}: ActiveGroupSwitcherProps) {
  const { pinned, current, selectScope } = useActiveScope();

  const CurrentIcon = scopeIcon(current);
  const currentLabel = scopeLabel(current, groups);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size={isMobile ? "sm" : "default"}
          className={className}
          aria-label={isMobile ? `Active scope: ${currentLabel}` : undefined}
        >
          <CurrentIcon className="h-4 w-4" />
          {!isMobile && (
            <span className="ml-2 flex items-center gap-1">
              {currentLabel}
              <ChevronDown className="h-3 w-3" />
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="bg-gray-800 border-purple-400/30">
        <ScopeMenuBody
          groups={groups}
          pinned={pinned}
          current={current}
          onSelect={selectScope}
        />
        <DropdownMenuSeparator className="bg-purple-400/30" />
        <DropdownMenuItem
          asChild
          className="text-purple-100 hover:bg-purple-600/30"
        >
          <Link to="/groups">
            <Settings className="h-4 w-4 mr-2" />
            Manage groups
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
