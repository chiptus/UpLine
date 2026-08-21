import { Link } from "@tanstack/react-router";
import { cn } from "@/lib/utils";

interface EditionNavLinkProps {
  to:
    | "/admin/festivals/$festivalSlug/editions/$editionSlug/stages"
    | "/admin/festivals/$festivalSlug/editions/$editionSlug/sets"
    | "/admin/festivals/$festivalSlug/editions/$editionSlug/import"
    | "/admin/festivals/$festivalSlug/editions/$editionSlug/links"
    | "/admin/festivals/$festivalSlug/editions/$editionSlug/settings";
  festivalSlug: string;
  editionSlug: string;
  icon: React.ReactNode;
  label: string;
  isActive: boolean;
}

export function EditionNavLink({
  to,
  festivalSlug,
  editionSlug,
  icon,
  label,
  isActive,
}: EditionNavLinkProps) {
  return (
    <Link
      to={to}
      params={{ festivalSlug, editionSlug }}
      className={cn(
        "flex items-center justify-center gap-2 px-4 py-2 rounded-md transition-colors",
        "text-white font-medium",
        isActive ? "bg-purple-600" : "hover:bg-white/10",
      )}
    >
      {icon}
      {label}
    </Link>
  );
}
