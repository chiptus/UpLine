import { Music, GlobeIcon } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useFestivalsQuery } from "@/api/festivals/useFestivals";
import { Festival } from "@/api/festivals/types";
import { useEffect } from "react";
import {
  createFestivalSubdomainUrl,
  isMainGetuplineDomain,
} from "@/lib/subdomain";
import { Link } from "@tanstack/react-router";
import { useCustomLinksQuery } from "@/api/custom-links/useCustomLinks";
import { PageTitle } from "@/components/PageTitle/PageTitle";
import { TopBar } from "@/components/layout/TopBar";
import { AppHeader } from "@/components/layout/AppHeader";

export default function FestivalSelection() {
  const { data: availableFestivals = [], isLoading: festivalsLoading } =
    useFestivalsQuery();

  function handleFestivalClick(festival: Festival) {
    const subdomainUrl = createFestivalSubdomainUrl(festival.slug);
    const isMain = isMainGetuplineDomain();

    if (isMain) {
      window.location.href = subdomainUrl;
    } else {
      window.location.href = `/festivals/${festival.slug}`;
    }
  }

  useEffect(() => {
    if (!festivalsLoading && availableFestivals.length === 1) {
      handleFestivalClick(availableFestivals[0]);
    }
  }, [availableFestivals, festivalsLoading]);

  if (festivalsLoading) {
    return (
      <div className="min-h-screen bg-app-gradient flex items-center justify-center">
        <div className="text-white text-xl">Loading festivals...</div>
      </div>
    );
  }

  if (availableFestivals.length === 0) {
    return (
      <div className="min-h-screen bg-app-gradient">
        <div className="container mx-auto px-4 py-8">
          <PageTitle title="Select Festival" />
          <TopBar />

          <div className="flex items-center justify-center mt-16">
            <Card className="w-full max-w-md bg-white/10 border-purple-400/30">
              <CardHeader className="text-center">
                <Music className="h-16 w-16 mx-auto text-purple-400 mb-4" />
                <CardTitle className="text-white">
                  No Festivals Available
                </CardTitle>
                <CardDescription className="text-purple-200">
                  There are currently no festivals open for voting. Check back
                  soon!
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-app-gradient">
      <div className="container mx-auto px-4 py-8">
        <AppHeader title="UpLine" />

        <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {availableFestivals.map((festival: Festival) => (
            <FestivalCard key={festival.id} festival={festival} />
          ))}
        </div>

        <div className="mt-16 text-center">
          <p className="text-purple-200 text-sm">
            Festival organizers can add their events through the admin panel
          </p>
        </div>
      </div>
    </div>
  );
}

function FestivalCard({ festival }: { festival: Festival }) {
  const customLinksQuery = useCustomLinksQuery(festival.id);
  const websiteUrl = customLinksQuery.data?.find(
    (link) => link.link_type === "website",
  )?.url;

  function handleClick(e: React.MouseEvent) {
    const isMain = isMainGetuplineDomain();

    if (isMain) {
      e.preventDefault();
      const subdomainUrl = createFestivalSubdomainUrl(festival.slug);
      window.location.href = subdomainUrl;
    }
  }

  return (
    <Link
      className="block cursor-pointer max-w-[90vw] w-full"
      to="/festivals/$festivalSlug"
      params={{ festivalSlug: festival.slug }}
      onClick={handleClick}
    >
      <Card className="bg-white/10 border-purple-400/30 hover:bg-white/15 transition-all duration-300 cursor-pointer group">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <CardTitle className="text-white text-xl mb-2 group-hover:text-purple-200 transition-colors">
                {festival.name}
              </CardTitle>
              {festival.description && (
                <CardDescription className="text-purple-200 text-sm">
                  {festival.description}
                </CardDescription>
              )}
            </div>
            <Music className="h-6 w-6 text-purple-400 ml-4" />
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {websiteUrl && (
            <div className="flex items-center gap-2 text-sm text-purple-200">
              <GlobeIcon className="h-4 w-4" />
              <span className="truncate">
                {websiteUrl.replace(/^https?:\/\//, "")}
              </span>
            </div>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}
