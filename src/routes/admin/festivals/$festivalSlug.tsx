import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useParams, useNavigate, Outlet, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { FestivalEditionManagement } from "@/pages/admin/festivals/FestivalEditionManagement";
import { FestivalInfoDetails } from "@/pages/admin/festivals/info/FestivalInfoDetails";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Info, ChevronDown, ChevronUp, ChevronRight } from "lucide-react";
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
  const [showFestivalInfo, setShowFestivalInfo] = useState(false);
  const navigate = useNavigate();

  const { data: festival } = useSuspenseQuery(
    festivalBySlugQuery(festivalSlug),
  );
  const editionQuery = useFestivalEditionBySlugQuery({
    editionSlug,
    festivalId: festival.id,
  });

  function handleEditionSelect(editionSlug: string | undefined) {
    if (!editionSlug) return;
    navigate({
      to: "/admin/festivals/$festivalSlug/editions/$editionSlug/stages",
      params: { festivalSlug, editionSlug },
    });
  }

  return (
    <>
      <nav
        aria-label="Breadcrumb"
        className="flex flex-wrap items-center justify-between gap-2 mb-6"
      >
        <div className="flex items-center gap-1 text-sm text-muted-foreground">
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
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowFestivalInfo(!showFestivalInfo)}
        >
          <Info className="h-4 w-4 mr-2" />
          Festival Info
          {showFestivalInfo ? (
            <ChevronUp className="h-4 w-4 ml-2" />
          ) : (
            <ChevronDown className="h-4 w-4 ml-2" />
          )}
        </Button>
      </nav>

      {showFestivalInfo && (
        <Card className="mb-6">
          <CardContent className="pt-6">
            <FestivalInfoDetails festivalId={festival.id} />
          </CardContent>
        </Card>
      )}

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
}
