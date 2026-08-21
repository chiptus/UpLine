import { Link } from "@tanstack/react-router";
import { ChevronRight } from "lucide-react";

interface FestivalBreadcrumbProps {
  festivalSlug: string;
  festivalName: string;
  editionSlug?: string | undefined;
  editionName?: string | undefined;
}

export function FestivalBreadcrumb({
  festivalSlug,
  festivalName,
  editionSlug,
  editionName,
}: FestivalBreadcrumbProps) {
  return (
    <nav
      aria-label="Breadcrumb"
      className="flex flex-wrap items-center gap-1 text-sm text-muted-foreground mb-6"
    >
      <Link to="/admin/festivals" className="font-medium hover:underline">
        Festivals
      </Link>
      <ChevronRight className="h-4 w-4" />
      {editionSlug ? (
        <Link
          to="/admin/festivals/$festivalSlug"
          params={{ festivalSlug }}
          className="font-medium hover:underline text-foreground"
        >
          {festivalName}
        </Link>
      ) : (
        <span className="font-medium text-foreground">{festivalName}</span>
      )}
      {editionSlug && (
        <>
          <ChevronRight className="h-4 w-4" />
          <span className="font-medium text-foreground">
            {editionName ?? editionSlug}
          </span>
        </>
      )}
    </nav>
  );
}
