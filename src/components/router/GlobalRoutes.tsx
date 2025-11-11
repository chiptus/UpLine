import { Navigate, Route, Routes } from "react-router-dom";

import AdminAnalytics from "@/pages/admin/Analytics/AdminAnalytics";
import AdminFestivals from "@/pages/admin/festivals/AdminFestivals";
import FestivalDetail from "@/pages/admin/festivals/FestivalDetail";
import FestivalEdition from "@/pages/admin/festivals/FestivalEdition";
import FestivalSets from "@/pages/admin/festivals/FestivalSets";
import FestivalStages from "@/pages/admin/festivals/FestivalStages";
import AdminLayout from "@/pages/admin/AdminLayout";
import CookiePolicy from "@/pages/legal/CookiePolicy";
import GroupDetail from "@/pages/groups/GroupDetail";
import Groups from "@/pages/groups/Groups";
import PrivacyPolicy from "@/pages/legal/PrivacyPolicy";
import TermsOfService from "@/pages/legal/TermsOfService";
import NotFound from "@/pages/NotFound";
import { AdminRolesTable } from "@/pages/admin/Roles/AdminRolesTable";
import { DuplicateArtistsPage } from "@/pages/admin/ArtistsManagement/DuplicateArtistsPage";
import { ArtistBulkEditor } from "@/pages/admin/ArtistsManagement/ArtistBulkEditor";
import { CSVImportPage } from "@/pages/admin/festivals/CSVImportPage";

export function GlobalRoutes() {
  return (
    <Routes>
      {/* Global routes (not scoped to festival/edition) */}
      <Route path="/groups" element={<Groups />} />
      <Route path="/groups/:groupSlug" element={<GroupDetail />} />

      {/* Admin routes */}
      <Route path="/admin" element={<AdminLayout />}>
        <Route index element={<Navigate to="artists" />} />
        <Route path="artists" element={<ArtistBulkEditor />} />
        <Route path="artists/duplicates" element={<DuplicateArtistsPage />} />
        <Route path="analytics" element={<AdminAnalytics />} />
        <Route path="admins" element={<AdminRolesTable />} />
        <Route path="festivals/import" element={<CSVImportPage />} />
        <Route
          path="festivals/:festivalId/:editionId/import"
          element={<CSVImportPage />}
        />
        <Route path="festivals" element={<AdminFestivals />}>
          <Route path=":festivalSlug" element={<FestivalDetail />}>
            <Route path="editions/:editionSlug" element={<FestivalEdition />}>
              <Route index element={<FestivalStages />} />
              <Route path="stages" element={<FestivalStages />} />
              <Route path="sets" element={<FestivalSets />} />
            </Route>
          </Route>
        </Route>
      </Route>

      {/* Legal pages */}
      <Route path="/privacy" element={<PrivacyPolicy />} />
      <Route path="/terms" element={<TermsOfService />} />
      <Route path="/cookies" element={<CookiePolicy />} />

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
