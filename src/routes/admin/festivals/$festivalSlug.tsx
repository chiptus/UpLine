import { createFileRoute } from "@tanstack/react-router";
import { useParams, useNavigate, Outlet, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { FestivalEditionManagement } from "@/pages/admin/festivals/FestivalEditionManagement";
import { ChevronRight } from "lucide-react";
import { festivalBySlugQuery } from "@/api/festivals/useFestivalBySlug";
import { useFestivalEditionBySlugQuery } from "@/api/editions/useFestivalEditionBySlug";
import { pageMeta } from "@/lib/pageHead";

export const Route = createFileRoute("/admin/festivals/$festivalSlug")({
  component: FestivalDetail,
  beforeLoad: async ({ params, context }) => {
    const festival = await context.queryClient.ensureQueryData(
      festivalBySlugQuery(params.festivalSlug),
    );
    return { festival };
  },
  head: ({ match }) => ({
    meta: pageMeta({ title: match.context.festival?.name, prefix: "Admin" }),
  }),
});

function FestivalDetail() {
  const { festivalSlug } = Route.useParams();
  const { editionSlug = "" } = useParams({ strict: false });
  const navigate = useNavigate();

  const { data: festival } = useSuspenseQuery(
    festivalBySlugQuery(festivalSlug),
  );
  const editionQuery = useFestivalEditionBySlugQuery({
    editionSlug,
    festivalId: festival.id,
  });

  return (
    <>
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
            {festival.name}
          </Link>
        ) : (
          <span className="font-medium text-foreground">{festival.name}</span>
        )}
        {editionSlug && (
          <>
            <ChevronRight className="h-4 w-4" />
            <span className="font-medium text-foreground">
              {editionQuery.data?.name ?? editionSlug}
            </span>
          </>
        )}
      </nav>

      {!editionSlug && (
        <div className="mb-6">
          <FestivalEditionManagement
            festivalSlug={festivalSlug}
            onSelect={(editionSlug) => {
              handleEditionSelect(editionSlug);
            }}
            selected={editionSlug}
          />
        </div>
      )}

      <Outlet />
    </>
  );

  function handleEditionSelect(editionSlug: string | undefined) {
    if (!editionSlug) return;
    navigate({
      to: "/admin/festivals/$festivalSlug/editions/$editionSlug/stages",
      params: { festivalSlug, editionSlug },
    });
  }
}
