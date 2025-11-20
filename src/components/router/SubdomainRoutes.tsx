import { Routes, Route } from "@tanstack/react-router";
import EditionSelection from "@/pages/EditionSelection";
import { GlobalRoutes } from "./GlobalRoutes";
import { createEditionRoutes } from "./EditionRoutes";
import { useState } from "react";

/**
 * Routes for subdomain access (boom-festival.getupline.com)
 * Root path shows edition selection for the festival
 */
export function SubdomainRoutes() {
  const [editionRoutes] = useState(() =>
    createEditionRoutes({
      basePath: "/editions/:editionSlug",
    }),
  );

  return (
    <Routes>
      <Route path="/" element={<EditionSelection />} />
      {/* Edition-specific routes */}
      {editionRoutes}

      <Route path="*" element={<GlobalRoutes />} />
    </Routes>
  );
}
