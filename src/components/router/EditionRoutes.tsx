import { Navigate, Route } from "@tanstack/react-router";
import EditionLayout from "@/pages/EditionView/EditionLayout";
import { SetDetails } from "@/pages/SetDetails";
import { ExploreSetPage } from "@/pages/ExploreSetPage/ExploreSetPage";

// Tab components
import { ArtistsTab } from "@/pages/EditionView/tabs/ArtistsTab/ArtistsTab";
import { MapTab } from "@/pages/EditionView/tabs/MapTab";
import { InfoTab } from "@/pages/EditionView/tabs/InfoTab";
import { SocialTab } from "@/pages/EditionView/tabs/SocialTab";
import { ScheduleTabTimeline } from "@/pages/EditionView/tabs/ScheduleTab/TimelineTab";
import { ScheduleTabList } from "@/pages/EditionView/tabs/ScheduleTab/list/ListTab";
import { ScheduleTab } from "@/pages/EditionView/tabs/ScheduleTab";

interface EditionRoutesProps {
  basePath: string;
  WrapperComponent?: React.ComponentType<{ component: React.ComponentType }>;
}

export function createEditionRoutes({
  basePath,
  WrapperComponent,
}: EditionRoutesProps) {
  const EditionComponent = WrapperComponent
    ? () => <WrapperComponent component={EditionLayout} />
    : EditionLayout;

  const SetDetailsComponent = WrapperComponent
    ? () => <WrapperComponent component={SetDetails} />
    : SetDetails;

  const ExploreComponent = WrapperComponent
    ? () => <WrapperComponent component={ExploreSetPage} />
    : ExploreSetPage;

  return [
    <Route key="main" path={basePath} element={<EditionComponent />}>
      {/* Nested tab routes */}
      <Route index element={<Navigate to="sets" replace />} />
      <Route path="sets" element={<ArtistsTab />} />
      <Route path="map" element={<MapTab />} />
      <Route path="info" element={<InfoTab />} />
      <Route path="social" element={<SocialTab />} />
      <Route path="schedule" element={<ScheduleTab />}>
        <Route index element={<Navigate to="timeline" replace />} />
        <Route path="timeline" element={<ScheduleTabTimeline />} />
        <Route path="list" element={<ScheduleTabList />} />
      </Route>
    </Route>,
    <Route
      key="sets"
      path={`${basePath}/sets/:setSlug`}
      element={<SetDetailsComponent />}
    />,
    <Route
      key="explore"
      path={`${basePath}/explore`}
      element={<ExploreComponent />}
    />,
  ];
}
