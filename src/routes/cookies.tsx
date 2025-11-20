import { createFileRoute } from "@tanstack/react-router";
import CookiePolicy from "@/pages/legal/CookiePolicy";

export const Route = createFileRoute("/cookies")({
  component: CookiePolicy,
});
