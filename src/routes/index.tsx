import { createFileRoute, redirect } from "@tanstack/react-router";
import FestivalSelection from "@/pages/FestivalSelection";
import { festivalsQuery } from "@/api/festivals/useFestivals";
import {
  createFestivalSubdomainUrl,
  isMainGetuplineDomain,
} from "@/lib/subdomain";

export const Route = createFileRoute("/")({
  component: FestivalSelection,
  beforeLoad: async ({ context }) => {
    const festivals =
      await context.queryClient.ensureQueryData(festivalsQuery());

    if (festivals.length === 1) {
      const festival = festivals[0];

      if (isMainGetuplineDomain()) {
        window.location.href = createFestivalSubdomainUrl(festival.slug);
        return;
      }

      throw redirect({
        to: "/festivals/$festivalSlug",
        params: { festivalSlug: festival.slug },
      });
    }
  },
});
