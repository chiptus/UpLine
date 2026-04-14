import { createFileRoute } from "@tanstack/react-router";
import { AdminRolesTable } from "@/pages/admin/Roles/AdminRolesTable";

export const Route = createFileRoute("/admin/admins")({
  component: AdminRolesTable,
});
