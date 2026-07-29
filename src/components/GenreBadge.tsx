import { useSuspenseQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { genresQuery } from "@/api/genres/useGenres";

interface GenreBadgeProps {
  genreId: string;
  size?: "default" | "sm";
}

export function GenreBadge({ genreId, size = "default" }: GenreBadgeProps) {
  const { data: genres } = useSuspenseQuery(genresQuery());

  const genre = genres.find((g) => g.id === genreId);
  if (!genre) return null;

  return (
    <Badge
      variant="secondary"
      className={`bg-purple-600/50 text-purple-100 ${
        size === "sm" ? "text-xs px-2 py-1" : ""
      }`}
    >
      {genre.name}
    </Badge>
  );
}
