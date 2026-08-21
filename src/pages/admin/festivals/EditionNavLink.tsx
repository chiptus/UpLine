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
      className="flex items-center justify-center gap-2 px-4 py-2 rounded-md transition-colors text-white font-medium"
      activeProps={{ className: "bg-purple-600" }}
      inactiveProps={{ className: "hover:bg-white/10" }}
    >
      {icon}
      {label}
    </Link>
  );
}
