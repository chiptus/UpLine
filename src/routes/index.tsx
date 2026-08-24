import { createFileRoute, redirect, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Music, GlobeIcon } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { festivalsQuery } from "@/api/festivals/useFestivals";
import { Festival } from "@/api/festivals/types";
import {
  createFestivalSubdomainUrl,
  isMainGetuplineDomain,
} from "@/lib/subdomain";
import { useCustomLinksQuery } from "@/api/custom-links/useCustomLinks";
import { pageMeta } from "@/lib/pageHead";
import { TopBar } from "@/components/layout/TopBar";
import { AppHeader } from "@/components/layout/AppHeader";

export const Route = createFileRoute("/")({
  component: FestivalSelection,
  head: () => ({
    meta: pageMeta({ title: "Select Festival" }),
  }),
  beforeLoad: async ({ context, search }) => {
    const festivals =
      await context.queryClient.ensureQueryData(festivalsQuery());

    if (festivals.length === 1 && !search.invite) {
      const festival = festivals[0];

      if (isMainGetuplineDomain()) {
        window.location.href = createFestivalSubdomainUrl(festival.slug);
        return;
      }

      throw redirect({
        to: "/festivals/$festivalSlug",
        params: { festivalSlug: festival.slug },
      });
    }
  },
});

function FestivalSelection() {
  const { data: availableFestivals } = useSuspenseQuery(festivalsQuery());

  if (availableFestivals.length === 0) {
    return (
      <div className="min-h-screen">
        <div className="container mx-auto px-4 py-8">
          <TopBar showGroupsButton />

          <div className="flex items-center justify-center mt-16">
            <Card className="w-full max-w-md bg-surface border-border">
              <CardHeader className="text-center">
                <Music className="h-16 w-16 mx-auto text-accent mb-4" />
                <CardTitle className="text-foreground">
                  No Festivals Available
                </CardTitle>
                <CardDescription className="text-muted-foreground">
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
    <div className="min-h-screen">
      <div className="container mx-auto px-4 py-8">
        <AppHeader title="UpLine" showGroupsButton />

        <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {availableFestivals.map((festival: Festival) => (
            <FestivalCard key={festival.id} festival={festival} />
          ))}
        </div>

        <div className="mt-16 text-center">
          <p className="text-muted-foreground text-sm">
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
      <Card className="bg-surface border-border hover:bg-surface-active transition-all duration-300 cursor-pointer group">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <CardTitle className="text-foreground text-xl mb-2 group-hover:text-accent transition-colors">
                {festival.name}
              </CardTitle>
              {festival.description && (
                <CardDescription className="text-muted-foreground text-sm">
                  {festival.description}
                </CardDescription>
              )}
            </div>
            <Music className="h-6 w-6 text-accent ml-4" />
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {websiteUrl && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
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
