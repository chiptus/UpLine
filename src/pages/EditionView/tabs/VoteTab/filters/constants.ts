export const SORT_OPTIONS = [
  { value: "name-asc", label: "Name (A-Z)" },
  { value: "name-desc", label: "Name (Z-A)" },
  { value: "rating-desc", label: "Highest Rated" },
  { value: "popularity-desc", label: "Most Popular" },
  { value: "date-asc", label: "By Date" },
] as const;

// Stages are now loaded dynamically from the database
export const STAGES: string[] = [];
