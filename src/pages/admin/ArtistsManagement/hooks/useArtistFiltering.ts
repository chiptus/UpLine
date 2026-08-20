import { useEffect, useState } from "react";

export function useArtistFiltering(
  urlSearchTerm: string,
  onDebouncedChange: (term: string) => void,
) {
  const [searchTerm, setSearchTerm] = useState(urlSearchTerm);

  useEffect(() => {
    setSearchTerm(urlSearchTerm);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [urlSearchTerm]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      if (searchTerm !== urlSearchTerm) onDebouncedChange(searchTerm);
    }, 300);
    return () => clearTimeout(timeout);
  }, [searchTerm, urlSearchTerm, onDebouncedChange]);

  return { searchTerm, setSearchTerm };
}
