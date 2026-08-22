import { createFileRoute, notFound, redirect } from "@tanstack/react-router";
import { useParams, Link, Outlet } from "@tanstack/react-router";
import { Link2, MapPin, Music, Settings, Upload } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import {
  editionBySlugQuery,
  EditionNotFoundError,
} from "@/api/editions/useFestivalEditionBySlug";
import { EditionNavLink } from "@/pages/admin/festivals/EditionNavLink";
import { pageMeta } from "@/lib/pageHead";

export const Route = createFileRoute(
  "/admin/festivals/$festivalSlug/editions/$editionSlug",
)({
  component: FestivalEdition,
  notFoundComponent: EditionNotFound,
  onError: (error) => {
    if (error instanceof EditionNotFoundError) {
      throw notFound();
    }
    throw error;
  },
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

function EditionNotFound() {
  const { festivalSlug } = Route.useParams();

  return (
    <Card>
      <CardContent className="flex flex-col items-center justify-center gap-4 p-8">
        <span>Edition not found</span>
        <Link
          to="/admin/festivals/$festivalSlug"
          params={{ festivalSlug }}
          className="text-primary underline"
        >
          Back to festival
        </Link>
      </CardContent>
    </Card>
  );
}

function FestivalEdition() {
  const { festivalSlug, editionSlug } = useParams({
    from: "/admin/festivals/$festivalSlug/editions/$editionSlug",
  });

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
