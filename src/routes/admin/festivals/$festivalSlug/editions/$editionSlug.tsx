import { createFileRoute, redirect } from "@tanstack/react-router";
import { useParams, Outlet } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Link2, Loader2, MapPin, Music, Settings, Upload } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { useFestivalEditionBySlugQuery } from "@/api/editions/useFestivalEditionBySlug";
import { festivalBySlugQuery } from "@/api/festivals/useFestivalBySlug";
import { EditionNavLink } from "@/pages/admin/festivals/EditionNavLink";
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

  return (
    <div className="space-y-6">
      <div className="w-full">
        <div className="sticky top-16 md:top-20 z-10 grid w-full grid-cols-5 gap-2 bg-white/10 backdrop-blur-md p-1 rounded-lg">
          <EditionNavLink
            to="stages"
            festivalSlug={festivalSlug}
            editionSlug={editionSlug}
            icon={<MapPin className="h-4 w-4" />}
            label="Stages"
          />
          <EditionNavLink
            to="sets"
            festivalSlug={festivalSlug}
            editionSlug={editionSlug}
            icon={<Music className="h-4 w-4" />}
            label="Sets"
          />
          <EditionNavLink
            to="import"
            festivalSlug={festivalSlug}
            editionSlug={editionSlug}
            icon={<Upload className="h-4 w-4" />}
            label="Import"
          />
          <EditionNavLink
            to="links"
            festivalSlug={festivalSlug}
            editionSlug={editionSlug}
            icon={<Link2 className="h-4 w-4" />}
            label="Links"
          />
          <EditionNavLink
            to="settings"
            festivalSlug={festivalSlug}
            editionSlug={editionSlug}
            icon={<Settings className="h-4 w-4" />}
            label="Settings"
          />
        </div>

        <div className="mt-6">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
