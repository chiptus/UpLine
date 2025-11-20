import { Routes, Route } from "@tanstack/react-router";

import { SubdomainRedirect } from "./SubdomainRedirect";
import FestivalSelection from "@/pages/FestivalSelection";
import EditionSelection from "@/pages/EditionSelection";
import { GlobalRoutes } from "./GlobalRoutes";
import { createEditionRoutes } from "./EditionRoutes";
import { useState } from "react";

/**
 * Routes for main domain access (getupline.com)
 * Includes festival selection and full admin interface
 */
export function MainDomainRoutes() {
  const [editionRoutes] = useState(
    createEditionRoutes({
      basePath: "/festivals/:festivalSlug/editions/:editionSlug",
      WrapperComponent: SubdomainRedirect,
    }),
  );

  return (
    <>
      <Routes>
        {/* Festival/Edition Selection Routes */}
        <Route path="/" element={<FestivalSelection />} />
        {/* Festival routes redirect to subdomains */}
        <Route
          path="/festivals/:festivalSlug"
          element={<SubdomainRedirect component={EditionSelection} />}
        />
        {/* Edition routes with subdomain redirect wrapper */}
        {editionRoutes}

        <Route path="*" element={<GlobalRoutes />} />
      </Routes>
    </>
  );
}
