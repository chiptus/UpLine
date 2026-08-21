import { createFileRoute } from "@tanstack/react-router";
import { SettingsPage } from "@/pages/Settings/SettingsPage";
import { pageMeta } from "@/lib/pageHead";

export const Route = createFileRoute("/settings")({
  component: Settings,
  head: () => ({
    meta: pageMeta({ title: "Settings" }),
  }),
});

function Settings() {
  return <SettingsPage />;
}
