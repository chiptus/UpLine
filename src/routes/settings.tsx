import { createFileRoute } from "@tanstack/react-router";
import { SettingsPage } from "@/pages/Settings/SettingsPage";
import { PageTitle } from "@/components/PageTitle/PageTitle";

export const Route = createFileRoute("/settings")({
  component: Settings,
});

function Settings() {
  return (
    <>
      <PageTitle title="Settings" />
      <SettingsPage />
    </>
  );
}
