import { createFileRoute, stripSearchParams } from "@tanstack/react-router";
import { SetDetails } from "@/pages/SetDetails";
import {
  filterSortSearchDefaults,
  filterSortSearchSchema,
} from "@/lib/searchSchemas";
import { setBySlugQuery } from "@/api/sets/useSetBySlug";
import { artistNotesQuery } from "@/api/artist-notes/useArtistNotes";

export const Route = createFileRoute(
  "/festivals/$festivalSlug/editions/$editionSlug/sets/$setSlug",
)({
  component: SetDetails,
  validateSearch: filterSortSearchSchema,
  search: {
    middlewares: [stripSearchParams(filterSortSearchDefaults)],
  },
  loader: async ({ params, context }) => {
    const set = await context.queryClient.ensureQueryData(
      setBySlugQuery(params.setSlug, context.edition.id),
    );
    void context.queryClient.ensureQueryData(artistNotesQuery(set.id));
  },
});
