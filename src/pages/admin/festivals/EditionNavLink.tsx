import { Link } from "@tanstack/react-router";

const EDITION_ROOT = "/admin/festivals/$festivalSlug/editions/$editionSlug";

interface EditionNavLinkProps {
  to: "stages" | "sets" | "import" | "links" | "settings";
  festivalSlug: string;
  editionSlug: string;
  icon: React.ReactNode;
  label: string;
}

export function EditionNavLink({
  to,
  festivalSlug,
  editionSlug,
  icon,
  label,
}: EditionNavLinkProps) {
  return (
    <Link
      from={EDITION_ROOT}
      to={to}
      params={{ festivalSlug, editionSlug }}
      className="flex items-center justify-center gap-2 px-4 py-2 rounded-md transition-colors text-foreground font-medium"
      activeProps={{ className: "bg-accent text-accent-foreground" }}
      inactiveProps={{ className: "hover:bg-surface-raised" }}
    >
      {icon}
      {label}
    </Link>
  );
}
