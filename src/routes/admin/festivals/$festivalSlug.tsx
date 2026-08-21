import { createFileRoute } from "@tanstack/react-router";
import { useParams, useNavigate, Outlet } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { FestivalEditionManagement } from "@/pages/admin/festivals/FestivalEditionManagement";
import { FestivalBreadcrumb } from "@/pages/admin/festivals/FestivalBreadcrumb";
import { festivalBySlugQuery } from "@/api/festivals/useFestivalBySlug";
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

  return (
    <>
      <FestivalBreadcrumb
        festivalSlug={festivalSlug}
        festivalName={festival.name}
        festivalId={festival.id}
        editionSlug={editionSlug || undefined}
      />

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
