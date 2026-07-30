import { createFileRoute } from "@tanstack/react-router";
import AdminFestivals from "@/pages/admin/festivals/AdminFestivals";
import { festivalsQuery } from "@/api/festivals/useFestivals";

export const Route = createFileRoute("/admin/festivals")({
  component: AdminFestivals,
  loader: async ({ context }) => {
    void context.queryClient.ensureQueryData(festivalsQuery({ all: true }));
  },
});
