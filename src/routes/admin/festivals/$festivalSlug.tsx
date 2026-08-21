import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useParams, useNavigate, Outlet } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { FestivalEditionManagement } from "@/pages/admin/festivals/FestivalEditionManagement";
import { FestivalMissingInfoBadge } from "@/pages/admin/festivals/FestivalMissingInfoBadge";
import { FestivalInfoDetails } from "@/pages/admin/festivals/info/FestivalInfoDetails";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Info,
  ChevronDown,
  ChevronUp,
  ChevronRight,
  CalendarDays,
} from "lucide-react";
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
  const [showFestivalCard, setShowFestivalCard] = useState(!editionSlug);
  const [showEditionsList, setShowEditionsList] = useState(!editionSlug);
  const navigate = useNavigate();

  const { data: festival } = useSuspenseQuery(
    festivalBySlugQuery(festivalSlug),
  );
  const editionQuery = useFestivalEditionBySlugQuery({
    editionSlug,
    festivalId: festival.id,
  });

  useEffect(() => {
    setShowFestivalCard(!editionSlug);
    setShowEditionsList(!editionSlug);
  }, [editionSlug]);

  function handleEditionSelect(editionSlug: string | undefined) {
    if (!editionSlug) return;
    navigate({
      to: "/admin/festivals/$festivalSlug/editions/$editionSlug/stages",
      params: { festivalSlug, editionSlug },
    });
    setShowFestivalCard(false);
    setShowEditionsList(false);
  }

  return (
    <>
      <nav
        aria-label="Breadcrumb"
        className="flex items-center gap-1 text-sm text-muted-foreground mb-4"
      >
        <span className="font-medium text-foreground">{festival.name}</span>
        {editionSlug && (
          <>
            <ChevronRight className="h-4 w-4" />
            <span className="text-foreground">
              {editionQuery.data?.name ?? editionSlug}
            </span>
          </>
        )}
      </nav>

      {showFestivalCard ? (
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
      ) : (
        <Card>
          <CardContent className="flex items-center justify-between py-4">
            <span className="flex items-center gap-2 text-sm">
              <span className="font-medium">{festival.name}</span>
              <FestivalMissingInfoBadge festivalId={festival.id} />
            </span>
            <Button variant="outline" onClick={() => setShowFestivalCard(true)}>
              Show Festival Info
            </Button>
          </CardContent>
        </Card>
      )}

      <div className="mt-6">
        {showEditionsList ? (
          <FestivalEditionManagement
            festivalSlug={festivalSlug}
            onSelect={(editionSlug) => {
              handleEditionSelect(editionSlug);
            }}
            selected={editionSlug}
          />
        ) : (
          <Card>
            <CardContent className="flex items-center justify-between py-4">
              <span className="flex items-center gap-2 text-sm">
                <CalendarDays className="h-4 w-4" />
                Edition:{" "}
                <span className="font-medium">
                  {editionQuery.data?.name ?? editionSlug}
                </span>
              </span>
              <Button
                variant="outline"
                onClick={() => setShowEditionsList(true)}
              >
                Change Edition
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      <div className="mt-6">
        <Outlet />
      </div>
    </>
  );
}
