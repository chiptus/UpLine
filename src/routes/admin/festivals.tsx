import { createFileRoute } from "@tanstack/react-router";
import { Outlet, useNavigate, useParams } from "@tanstack/react-router";
import { FestivalManagementSection } from "@/pages/admin/festivals/FestivalManagementSection";
import { festivalsQuery } from "@/api/festivals/useFestivals";
import { pageMeta } from "@/lib/pageHead";

export const Route = createFileRoute("/admin/festivals")({
  component: AdminFestivals,
  head: () => ({
    meta: pageMeta({ title: "Festivals", prefix: "Admin" }),
  }),
  loader: async ({ context }) => {
    void context.queryClient.ensureQueryData(festivalsQuery({ all: true }));
  },
});

function AdminFestivals() {
  const navigate = useNavigate();
  const { festivalSlug = "" } = useParams({ strict: false });

  function handleFestivalChange(festivalSlug: string) {
    if (festivalSlug === "none") {
      navigate({ to: "/admin/festivals" });
    } else {
      navigate({
        to: "/admin/festivals/$festivalSlug",
        params: { festivalSlug },
      });
    }
  }

  return (
    <div className="space-y-6">
      {!festivalSlug && (
        <FestivalManagementSection
          selected={festivalSlug}
          onSelect={(festival) => handleFestivalChange(festival.slug)}
        />
      )}

      <Outlet />
    </div>
  );
}
