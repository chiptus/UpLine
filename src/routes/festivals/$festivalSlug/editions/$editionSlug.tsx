import {
  createFileRoute,
  notFound,
  redirect,
  Link,
  Outlet,
} from "@tanstack/react-router";
import { EditionHeader } from "@/pages/EditionView/EditionHeader";
import { MainTabNavigation } from "@/pages/EditionView/TabNavigation/TabNavigation";
import ErrorBoundary from "@/components/ErrorBoundary";
import { editionBySlugQuery } from "@/api/editions/useFestivalEditionBySlug";
import { stagesByEditionQuery } from "@/api/stages/useStagesByEdition";
import { stagesKeys } from "@/api/stages/types";
import { getEffectiveFestivalPhase } from "@/lib/festivalPhase";
import { getDefaultTab } from "@/pages/EditionView/TabNavigation/defaultTab";
import { tabRoutes } from "@/pages/EditionView/TabNavigation/tabRoutes";
import { pageMeta } from "@/lib/pageHead";
import { SupabaseNotFoundError } from "@/lib/supabaseErrors";

export const Route = createFileRoute(
  "/festivals/$festivalSlug/editions/$editionSlug",
)({
  component: EditionLayout,
  notFoundComponent: EditionNotFound,
  onError: (error) => {
    if (error instanceof SupabaseNotFoundError) {
      throw notFound();
    }
    throw error;
  },
  beforeLoad: async ({ params, location, context }) => {
    const edition = await context.queryClient.ensureQueryData(
      editionBySlugQuery({
        festivalId: context.festival.id,
        editionSlug: params.editionSlug,
      }),
    );

    const basePath = `/festivals/${params.festivalSlug}/editions/${params.editionSlug}`;
    if (
      location.pathname === basePath ||
      location.pathname === `${basePath}/`
    ) {
      const phase = getEffectiveFestivalPhase({
        override: edition.phase_override,
        derivedInput: {
          revealLevel: edition.schedule_reveal_level,
          startDate: edition.start_date,
          endDate: edition.end_date,
          timezone: context.festival.timezone,
          now: new Date(),
        },
      });

      throw redirect({
        to: tabRoutes[getDefaultTab(phase)],
        params,
        search: location.search as Record<string, unknown>,
      });
    }

    return { edition };
  },
  loader: async ({ context }) => {
    void context.queryClient
      .ensureQueryData(stagesByEditionQuery(context.edition.id))
      .then((stages) => {
        for (const stage of stages) {
          context.queryClient.setQueryData(stagesKeys.byId(stage.id), stage);
        }
      });
  },
  head: ({ match }) => ({
    meta: pageMeta({
      title: match.context.edition?.name,
      prefix: match.context.festival?.name,
    }),
  }),
});

function EditionLayout() {
  const { festival, edition } = Route.useRouteContext();

  return (
    <div className="min-h-screen bg-app-gradient">
      <div className="container mx-auto px-4 py-4 md:py-8 pb-20 md:pb-8">
        <EditionHeader
          title={`${festival.name} - ${edition.name}`}
          festivalName={festival.name}
          logoUrl={festival.logo_url}
        />

        <MainTabNavigation />

        <div className="mt-4 md:mt-8">
          <ErrorBoundary>
            <Outlet />
          </ErrorBoundary>
        </div>
      </div>
    </div>
  );
}

function EditionNotFound() {
  const { festivalSlug } = Route.useParams();

  return (
    <div className="min-h-screen bg-app-gradient flex items-center justify-center p-4">
      <div className="text-center text-white">
        <h1 className="text-2xl font-bold mb-4">Edition not found</h1>
        <p className="mb-6 text-purple-200">
          We couldn&apos;t find that festival edition. It may have been removed
          or the link may be incorrect.
        </p>
        <Link
          to="/festivals/$festivalSlug"
          params={{ festivalSlug }}
          className="bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded inline-block"
        >
          Back to festival
        </Link>
      </div>
    </div>
  );
}
