import { useParams, useLocation, Outlet, Link } from "@tanstack/react-router";
import { Loader2, MapPin, Music } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useFestivalEditionBySlugQuery } from "@/hooks/queries/festivals/editions/useFestivalEditionBySlug";
import { cn } from "@/lib/utils";

export default function FestivalEdition() {
  const { festivalSlug, editionSlug } = useParams({
    from: "/admin/festivals/$festivalSlug/editions/$editionSlug",
  });
  const location = useLocation();

  const editionQuery = useFestivalEditionBySlugQuery({
    festivalSlug,
    editionSlug,
  });

  if (!festivalSlug || !editionSlug) {
    return <div>Festival or edition not found</div>;
  }

  if (editionQuery.isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-8">
          <Loader2 className="h-6 w-6 animate-spin mr-2" />
          <span>Loading festivals...</span>
        </CardContent>
      </Card>
    );
  }

  const currentEdition = editionQuery.data;

  if (!currentEdition) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-8">
          <span>Edition not found</span>
        </CardContent>
      </Card>
    );
  }

  const isOnSets = location.pathname.includes("/sets");
  const isOnStages = location.pathname.includes("/stages");

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              Edition: {currentEdition.name}
            </span>
          </CardTitle>
        </CardHeader>
      </Card>
      <div className="w-full">
        <div className="grid w-full grid-cols-2 gap-2 bg-white/10 backdrop-blur-md p-1 rounded-lg">
          <Link
            to="/admin/festivals/$festivalSlug/editions/$editionSlug/stages"
            params={{ festivalSlug, editionSlug }}
            className={cn(
              "flex items-center justify-center gap-2 px-4 py-2 rounded-md transition-colors",
              "text-white font-medium",
              isOnStages ? "bg-purple-600" : "hover:bg-white/10",
            )}
          >
            <MapPin className="h-4 w-4" />
            Stages
          </Link>
          <Link
            to="/admin/festivals/$festivalSlug/editions/$editionSlug/sets"
            params={{ festivalSlug, editionSlug }}
            className={cn(
              "flex items-center justify-center gap-2 px-4 py-2 rounded-md transition-colors",
              "text-white font-medium",
              isOnSets ? "bg-purple-600" : "hover:bg-white/10",
            )}
          >
            <Music className="h-4 w-4" />
            Sets
          </Link>
        </div>

        <div className="mt-6">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
