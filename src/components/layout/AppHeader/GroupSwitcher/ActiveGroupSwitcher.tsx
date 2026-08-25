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
          aria-label={`Active scope: ${currentLabel}`}
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
      <DropdownMenuContent>
        <ScopeMenuBody
          groups={groups}
          pinned={pinned}
          current={current}
          onSelect={selectScope}
        />
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link to="/groups">
            <Settings className="h-4 w-4 mr-2" />
            Manage groups
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
