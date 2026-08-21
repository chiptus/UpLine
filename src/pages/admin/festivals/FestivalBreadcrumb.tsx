import { Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { ChevronRight } from "lucide-react";
import { editionBySlugQuery } from "@/api/editions/useFestivalEditionBySlug";

interface FestivalBreadcrumbProps {
  festivalSlug: string;
  festivalName: string;
  festivalId: string;
  editionSlug?: string | undefined;
}

export function FestivalBreadcrumb({
  festivalSlug,
  festivalName,
  festivalId,
  editionSlug,
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
          <EditionCrumb festivalId={festivalId} editionSlug={editionSlug} />
        </>
      )}
    </nav>
  );
}

function EditionCrumb({
  festivalId,
  editionSlug,
}: {
  festivalId: string;
  editionSlug: string;
}) {
  const { data: edition } = useSuspenseQuery(
    editionBySlugQuery({ festivalId, editionSlug }),
  );

  return <span className="font-medium text-foreground">{edition.name}</span>;
}
