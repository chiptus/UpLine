import { createFileRoute, redirect } from "@tanstack/react-router";
import EditionSelection from "@/pages/EditionSelection";
import { festivalBySlugQuery } from "@/api/festivals/useFestivalBySlug";
import { editionsForFestivalQuery } from "@/api/editions/useFestivalEditionsForFestival";

export const Route = createFileRoute("/festivals/$festivalSlug/")({
  component: EditionSelection,
  beforeLoad: async ({ params, context }) => {
    const festival = await context.queryClient.ensureQueryData(
      festivalBySlugQuery(params.festivalSlug),
    );
    const editions = await context.queryClient.ensureQueryData(
      editionsForFestivalQuery(festival.id),
    );

    if (editions.length === 1) {
      throw redirect({
        to: "/festivals/$festivalSlug/editions/$editionSlug",
        params: {
          festivalSlug: params.festivalSlug,
          editionSlug: editions[0].slug,
        },
      });
    }
  },
});
