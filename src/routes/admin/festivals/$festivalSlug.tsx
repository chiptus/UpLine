import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useParams, useNavigate, Outlet } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { FestivalEditionManagement } from "@/pages/admin/festivals/FestivalEditionManagement";
import { FestivalMissingInfoBadge } from "@/pages/admin/festivals/FestivalMissingInfoBadge";
import { FestivalInfoDetails } from "@/pages/admin/festivals/info/FestivalInfoDetails";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Info, ChevronDown, ChevronUp } from "lucide-react";
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
    meta: pageMeta({ title: match.context.festival.name, prefix: "Admin" }),
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

  function handleEditionSelect(editionSlug: string | undefined) {
    if (!editionSlug) return;
    navigate({
      to: "/admin/festivals/$festivalSlug/editions/$editionSlug/stages",
      params: { festivalSlug, editionSlug },
    });
  }

  return (
    <>
      <>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                {festival.name}
                <FestivalMissingInfoBadge festivalId={festival.id} />
              </span>
              <Button
                variant="outline"
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
            </CardTitle>
          </CardHeader>
          {showFestivalInfo && (
            <CardContent>
              <FestivalInfoDetails festivalId={festival.id} />
            </CardContent>
          )}
        </Card>

        <div className="mt-6">
          <FestivalEditionManagement
            festivalSlug={festivalSlug}
            onSelect={(editionSlug) => {
              handleEditionSelect(editionSlug);
            }}
            selected={editionSlug}
          />
        </div>
      </>

      <div className="mt-6">
        <Outlet />
      </div>
    </>
  );
}
