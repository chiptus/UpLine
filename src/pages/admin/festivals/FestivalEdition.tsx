import { useParams, useLocation, useNavigate, Outlet } from "@tanstack/react-router";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, MapPin, Music } from "lucide-react";
import { useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useFestivalEditionBySlugQuery } from "@/hooks/queries/festivals/editions/useFestivalEditionBySlug";

export default function FestivalEdition() {
  const { festivalSlug, editionSlug } = useParams({ strict: false });
  const location = useLocation();
  const navigate = useNavigate();

  // Redirect to stages if we're at the index route
  useEffect(() => {
    if (
      festivalSlug &&
      editionSlug &&
      location.pathname ===
        `/admin/festivals/${festivalSlug}/editions/${editionSlug}`
    ) {
      navigate({
        to: "/admin/festivals/$festivalSlug/editions/$editionSlug/stages",
        params: { festivalSlug, editionSlug },
      });
    }
  }, [location.pathname, festivalSlug, editionSlug, navigate]);

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

  // Determine current subtab based on URL
  function getCurrentSubTab() {
    const path = location.pathname;
    if (path.includes("/sets")) return "sets";
    return "stages";
  }

  const currentSubTab = getCurrentSubTab();

  function handleSubTabChange(value: string) {
    navigate({
      to: `/admin/festivals/$festivalSlug/editions/$editionSlug/${value}`,
      params: { festivalSlug, editionSlug },
    });
  }

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
      <Tabs
        value={currentSubTab}
        onValueChange={handleSubTabChange}
        className="w-full"
      >
        <TabsList className="grid w-full grid-cols-2 bg-white/10 backdrop-blur-md">
          <TabsTrigger
            value="stages"
            className="data-[state=active]:bg-purple-600 data-[state=active]:text-white text-white"
          >
            <MapPin className="h-4 w-4 mr-2" />
            Stages
          </TabsTrigger>
          <TabsTrigger
            value="sets"
            className="data-[state=active]:bg-purple-600 data-[state=active]:text-white text-white"
          >
            <Music className="h-4 w-4 mr-2" />
            Sets
          </TabsTrigger>
        </TabsList>

        <div className="mt-6">
          <Outlet />
        </div>
      </Tabs>
    </div>
  );
}
