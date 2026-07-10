import { useParams, useLocation, Outlet, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Loader2, MapPin, Music, Upload } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useFestivalEditionBySlugQuery } from "@/api/editions/useFestivalEditionBySlug";
import { festivalBySlugQuery } from "@/api/festivals/useFestivalBySlug";
import { cn } from "@/lib/utils";
import { getFestivalPhase } from "@/lib/festivalPhase";
import { ScheduleRevealControl } from "./ScheduleRevealControl";
import { PhaseOverrideControl } from "./PhaseOverrideControl";

export default function FestivalEdition() {
  const { festivalSlug, editionSlug } = useParams({
    from: "/admin/festivals/$festivalSlug/editions/$editionSlug",
  });
  const location = useLocation();

  const { data: festival } = useSuspenseQuery(
    festivalBySlugQuery(festivalSlug),
  );
  const editionQuery = useFestivalEditionBySlugQuery({
    editionSlug,
    festivalId: festival.id,
  });

  if (!festivalSlug || !editionSlug) {
    return <div>Festival or edition not found</div>;
  }

  if (editionQuery.isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-8">
          <Loader2 className="h-6 w-6 animate-spin mr-2" />
          <span>Loading festivals...</span>
        </CardContent>
      </Card>
    );
  }

  const currentEdition = editionQuery.data;

  if (!currentEdition) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-8">
          <span>Edition not found</span>
        </CardContent>
      </Card>
    );
  }

  const isOnSets = location.pathname.includes("/sets");
  const isOnStages = location.pathname.includes("/stages");
  const isOnImport = location.pathname.includes("/import");

  const derivedPhase = getFestivalPhase({
    revealLevel: currentEdition.schedule_reveal_level ?? "draft",
    startDate: currentEdition.start_date,
    endDate: currentEdition.end_date,
    timezone: festival.timezone,
    now: new Date(),
  });

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex flex-wrap items-center justify-between gap-3">
            <span className="flex items-center gap-2">
              Edition: {currentEdition.name}
            </span>
            <div className="flex flex-wrap items-center gap-2">
              <ScheduleRevealControl
                editionId={currentEdition.id}
                level={currentEdition.schedule_reveal_level ?? "draft"}
                editionPublished={currentEdition.published ?? false}
              />
              <PhaseOverrideControl
                editionId={currentEdition.id}
                override={currentEdition.phase_override ?? null}
                derivedPhase={derivedPhase}
              />
            </div>
          </CardTitle>
        </CardHeader>
      </Card>
      <div className="w-full">
        <div className="grid w-full grid-cols-3 gap-2 bg-white/10 backdrop-blur-md p-1 rounded-lg">
          <Link
            to="/admin/festivals/$festivalSlug/editions/$editionSlug/stages"
            params={{ festivalSlug, editionSlug }}
            className={cn(
              "flex items-center justify-center gap-2 px-4 py-2 rounded-md transition-colors",
              "text-white font-medium",
              isOnStages ? "bg-purple-600" : "hover:bg-white/10",
            )}
          >
            <MapPin className="h-4 w-4" />
            Stages
          </Link>
          <Link
            to="/admin/festivals/$festivalSlug/editions/$editionSlug/sets"
            params={{ festivalSlug, editionSlug }}
            className={cn(
              "flex items-center justify-center gap-2 px-4 py-2 rounded-md transition-colors",
              "text-white font-medium",
              isOnSets ? "bg-purple-600" : "hover:bg-white/10",
            )}
          >
            <Music className="h-4 w-4" />
            Sets
          </Link>
          <Link
            to="/admin/festivals/$festivalSlug/editions/$editionSlug/import"
            params={{ festivalSlug, editionSlug }}
            className={cn(
              "flex items-center justify-center gap-2 px-4 py-2 rounded-md transition-colors",
              "text-white font-medium",
              isOnImport ? "bg-purple-600" : "hover:bg-white/10",
            )}
          >
            <Upload className="h-4 w-4" />
            Import
          </Link>
        </div>

        <div className="mt-6">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
