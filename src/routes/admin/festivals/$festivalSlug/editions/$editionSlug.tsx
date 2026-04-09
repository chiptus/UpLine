import { createFileRoute, redirect } from "@tanstack/react-router";
import FestivalEdition from "@/pages/admin/festivals/FestivalEdition";
import { editionsKeys } from "@/hooks/queries/festivals/editions/types";
import type { QueryClient } from "@tanstack/react-query";

async function fetchFestivalEditionBySlug({
  festivalSlug,
  editionSlug,
}: {
  festivalSlug: string;
  editionSlug: string;
}) {
  const { supabase } = await import("@/integrations/supabase/client");

  // First get the festival ID from the slug
  const { data: festival, error: festivalError } = await supabase
    .from("festivals")
    .select("*")
    .eq("archived", false)
    .eq("slug", festivalSlug)
    .single();

  if (festivalError) {
    throw new Error("Failed to load festival");
  }

  const { data, error } = await supabase
    .from("festival_editions")
    .select("*")
    .eq("archived", false)
    .eq("festival_id", festival.id)
    .eq("slug", editionSlug)
    .single();

  if (error) {
    throw new Error("Failed to load festival edition");
  }

  return data;
}

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

    const queryClient = (context as { queryClient: QueryClient }).queryClient;
    await queryClient.ensureQueryData({
      queryKey: editionsKeys.bySlug(params.festivalSlug, params.editionSlug),
      queryFn: () =>
        fetchFestivalEditionBySlug({
          festivalSlug: params.festivalSlug,
          editionSlug: params.editionSlug,
        }),
    });

    return {
      ...context,
      festivalSlug: params.festivalSlug,
      editionSlug: params.editionSlug,
    };
  },
});
