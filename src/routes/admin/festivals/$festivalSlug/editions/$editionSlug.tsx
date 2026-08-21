import { createFileRoute, redirect } from "@tanstack/react-router";
import { useParams, useLocation, Outlet, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Link2, Loader2, MapPin, Music, Settings, Upload } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { useFestivalEditionBySlugQuery } from "@/api/editions/useFestivalEditionBySlug";
import { festivalBySlugQuery } from "@/api/festivals/useFestivalBySlug";
import { cn } from "@/lib/utils";
import { editionBySlugQuery } from "@/api/editions/useFestivalEditionBySlug";
import { pageMeta } from "@/lib/pageHead";

export const Route = createFileRoute(
  "/admin/festivals/$festivalSlug/editions/$editionSlug",
)({
  component: FestivalEdition,
  beforeLoad: async ({ params, location, context }) => {
    if (params?.editionSlug && location.pathname.endsWith(params.editionSlug)) {
      throw redirect({
        to: "/admin/festivals/$festivalSlug/editions/$editionSlug/stages",
        params,
        search: location.search as Record<string, unknown>,
      });
    }

    const edition = await context.queryClient.ensureQueryData(
      editionBySlugQuery({
        festivalId: context.festival.id,
        editionSlug: params.editionSlug,
      }),
    );

    return { edition };
  },
  head: ({ match }) => ({
    meta: pageMeta({
      title: match.context.edition?.name,
      prefix: `Admin - ${match.context.festival?.name}`,
    }),
  }),
});

function FestivalEdition() {
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
  const isOnLinks = location.pathname.includes("/links");
  const isOnSettings = location.pathname.includes("/settings");

  return (
    <div className="space-y-6">
      <div className="w-full">
        <div className="sticky top-16 md:top-20 z-10 grid w-full grid-cols-5 gap-2 bg-white/10 backdrop-blur-md p-1 rounded-lg">
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
          <Link
            to="/admin/festivals/$festivalSlug/editions/$editionSlug/links"
            params={{ festivalSlug, editionSlug }}
            className={cn(
              "flex items-center justify-center gap-2 px-4 py-2 rounded-md transition-colors",
              "text-white font-medium",
              isOnLinks ? "bg-purple-600" : "hover:bg-white/10",
            )}
          >
            <Link2 className="h-4 w-4" />
            Links
          </Link>
          <Link
            to="/admin/festivals/$festivalSlug/editions/$editionSlug/settings"
            params={{ festivalSlug, editionSlug }}
            className={cn(
              "flex items-center justify-center gap-2 px-4 py-2 rounded-md transition-colors",
              "text-white font-medium",
              isOnSettings ? "bg-purple-600" : "hover:bg-white/10",
            )}
          >
            <Settings className="h-4 w-4" />
            Settings
          </Link>
        </div>

        <div className="mt-6">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
