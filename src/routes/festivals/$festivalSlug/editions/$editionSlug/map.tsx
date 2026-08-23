import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { festivalInfoQuery } from "@/api/festival-info/useFestivalInfo";
import { pageMeta } from "@/lib/pageHead";

export const Route = createFileRoute(
  "/festivals/$festivalSlug/editions/$editionSlug/map",
)({
  component: MapTab,
  head: ({ match }) => ({
    meta: pageMeta({ title: "Map", prefix: match.context.festival?.name }),
  }),
});

function MapTab() {
  const { festival } = Route.useRouteContext();
  const { data: festivalInfo } = useSuspenseQuery(
    festivalInfoQuery(festival.id),
  );

  if (!festivalInfo?.map_image_url) {
    return (
      <>
        <div className="text-center text-purple-300 py-12">
          <p>Festival map not available yet.</p>
        </div>
      </>
    );
  }

  return (
    <>
      <div className="space-y-6">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-white mb-4">
            Festival Map
          </h2>
        </div>

        <div className="bg-white/5 rounded-lg p-4">
          <img
            src={festivalInfo.map_image_url}
            alt="Festival Map"
            className="w-full h-auto rounded-lg"
            style={{ maxHeight: "80vh", objectFit: "contain" }}
          />
        </div>
      </div>
    </>
  );
}
