import { createFileRoute, redirect } from "@tanstack/react-router";
import AdminLayout from "@/pages/admin/AdminLayout";

export const Route = createFileRoute("/admin")({
  component: AdminLayout,
  beforeLoad: ({ location }) => {
    if (location.pathname === "/admin" || location.pathname === "/admin/") {
      throw redirect({
        to: "/admin/artists",
        search: location.search,
      });
    }
  },
});
