import { createFileRoute, stripSearchParams } from "@tanstack/react-router";
import { useParams, useRouteContext } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { ArtistImageCard } from "@/pages/SetDetails/SetImageCard";
import { MixedArtistImage } from "@/pages/SetDetails/MixedArtistImage";
import { SetInfoCard } from "@/pages/SetDetails/SetInfoCard";
import { MultiArtistSetInfoCard } from "@/pages/SetDetails/MultiArtistSetInfoCard";
import { SetGroupVoting } from "@/pages/SetDetails/SetGroupVoting";
import { SetNotes } from "@/pages/SetDetails/SetNotes";
import { useUrlState } from "@/hooks/useUrlState";
import { setBySlugQuery } from "@/api/sets/useSetBySlug";
import { useFestivalEdition } from "@/contexts/FestivalEditionContext";
import { useAuth } from "@/contexts/AuthContext";
import { useVoteCount } from "@/hooks/useVoteCount";
import { PageTitle } from "@/components/PageTitle/PageTitle";
import { TopBar } from "@/components/layout/TopBar";
import { FestivalIndicator } from "@/components/layout/AppHeader/FestivalIndicator";
import {
  filterSortSearchDefaults,
  filterSortSearchSchema,
} from "@/lib/searchSchemas";
import { artistNotesQuery } from "@/api/artist-notes/useArtistNotes";
import { genresQuery } from "@/api/genres/useGenres";

export const Route = createFileRoute(
  "/festivals/$festivalSlug/editions/$editionSlug/sets/$setSlug",
)({
  component: SetDetails,
  validateSearch: filterSortSearchSchema,
  search: {
    middlewares: [stripSearchParams(filterSortSearchDefaults)],
  },
  loader: async ({ params, context }) => {
    void context.queryClient.ensureQueryData(genresQuery());
    const set = await context.queryClient.ensureQueryData(
      setBySlugQuery(params.setSlug, context.edition.id),
    );
    void context.queryClient.ensureQueryData(artistNotesQuery(set.id));
  },
});

function SetDetails() {
  const { user } = useAuth();
  const { setSlug } = useParams({
    from: "/festivals/$festivalSlug/editions/$editionSlug/sets/$setSlug",
  });
  const { festival } = useFestivalEdition();
  const { edition } = useRouteContext({
    from: "/festivals/$festivalSlug/editions/$editionSlug/sets/$setSlug",
  });
  const { state: urlState } = useUrlState();
  const { data: currentSet } = useSuspenseQuery(
    setBySlugQuery(setSlug, edition.id),
  );

  const { getVoteCount } = useVoteCount(currentSet);

  const setTitle = currentSet.name;

  const netVoteScore = 2 * getVoteCount(2) + getVoteCount(1) - getVoteCount(-1);

  const isMultiArtistSet = currentSet.artists.length > 1;
  const primaryArtist = currentSet.artists[0];

  return (
    <>
      <PageTitle title={setTitle} prefix={festival?.name} />
      <div className="min-h-screen bg-app-gradient">
        <div className="container mx-auto px-4 py-8">
          <TopBar showBackButton backLabel="Back to Artists" showGroupsButton>
            <FestivalIndicator
              festivalName={festival?.name}
              logoUrl={festival?.logo_url}
            />
          </TopBar>

          {/* Set Header */}
          {isMultiArtistSet ? (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
              {/* Mixed Image for Multi-Artist Sets */}
              <MixedArtistImage
                artists={currentSet.artists}
                setName={currentSet.name}
                className="aspect-square rounded-lg"
              />

              <MultiArtistSetInfoCard
                set={currentSet}
                netVoteScore={netVoteScore}
                use24Hour={urlState.use24Hour}
              />
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
              <ArtistImageCard
                imageUrl={primaryArtist.image_url}
                artistName={currentSet.name}
              />

              <SetInfoCard
                set={currentSet}
                netVoteScore={netVoteScore}
                use24Hour={urlState.use24Hour}
              />
            </div>
          )}

          {/* Set Group Voting Section */}
          <div className="mb-8">
            <SetGroupVoting setId={currentSet.id} />
          </div>

          {/* Set Notes Section */}
          <div className="mb-8">
            <SetNotes setId={currentSet.id} userId={user?.id || null} />
          </div>
        </div>
      </div>
    </>
  );
}
