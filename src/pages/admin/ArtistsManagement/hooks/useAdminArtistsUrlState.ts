import { useCallback } from "react";
import { useNavigate, useSearch } from "@tanstack/react-router";
import type { AdminArtistsSearch } from "../searchSchema";

export function useAdminArtistsUrlState() {
  const search = useSearch({ from: "/admin/artists" });
  const navigate = useNavigate({ from: "/admin/artists" });

  const updateUrlState = useCallback(
    (updates: Partial<AdminArtistsSearch>) => {
      navigate({
        to: ".",
        search: (prev) => ({ ...prev, ...updates }),
        replace: true,
        resetScroll: false,
      });
    },
    [navigate],
  );

  return { state: search, updateUrlState };
}
