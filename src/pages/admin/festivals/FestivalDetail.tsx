import { useState } from "react";
import { useParams, useNavigate, Outlet } from "@tanstack/react-router";
import { FestivalEditionManagement } from "./FestivalEditionManagement";
import { FestivalInfoDetails } from "@/pages/admin/festivals/info/FestivalInfoDetails";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useFestivalBySlugQuery } from "@/api/festivals/useFestivalBySlug";
import { Loader2, Info, ChevronDown, ChevronUp } from "lucide-react";

export default function FestivalDetail() {
  const { festivalSlug, editionSlug = "" } = useParams({ strict: false });
  const [showFestivalInfo, setShowFestivalInfo] = useState(false);
  const navigate = useNavigate();

  const festivalQuery = useFestivalBySlugQuery(festivalSlug);

  if (!festivalSlug) {
    return <div>festivalSlug param is missing</div>;
  }

  if (festivalQuery.isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-8">
          <Loader2 className="h-6 w-6 animate-spin mr-2" />
          <span>Loading festivals...</span>
        </CardContent>
      </Card>
    );
  }

  if (!festivalQuery.data) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-8">
          <span>Festival not found</span>
        </CardContent>
      </Card>
    );
  }

  function handleEditionSelect(editionSlug: string | undefined) {
    if (!editionSlug || !festivalSlug) return;
    navigate({
      to: "/admin/festivals/$festivalSlug/editions/$editionSlug/stages",
      params: { festivalSlug, editionSlug },
    });
  }

  const festival = festivalQuery.data;

  return (
    <>
      <>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">{festival.name}</span>
              <Button
                variant="outline"
                onClick={() => setShowFestivalInfo(!showFestivalInfo)}
              >
                <Info className="h-4 w-4 mr-2" />
                Festival Info
                {showFestivalInfo ? (
                  <ChevronUp className="h-4 w-4 ml-2" />
                ) : (
                  <ChevronDown className="h-4 w-4 ml-2" />
                )}
              </Button>
            </CardTitle>
          </CardHeader>
          {showFestivalInfo && (
            <CardContent>
              <FestivalInfoDetails festivalId={festival.id} />
            </CardContent>
          )}
        </Card>

        <div className="mt-6">
          <FestivalEditionManagement
            festivalSlug={festivalSlug}
            onSelect={(editionSlug) => {
              handleEditionSelect(editionSlug);
            }}
            selected={editionSlug}
          />
        </div>
      </>

      <div className="mt-6">
        <Outlet />
      </div>
    </>
  );
}
