import { createFileRoute, redirect } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { editionsForFestivalQuery } from "@/api/editions/useFestivalEditionsForFestival";
import { Calendar, MapPin, Clock, Users, ArrowLeft } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AppHeader } from "@/components/layout/AppHeader";
import { Link } from "@tanstack/react-router";
import { FestivalEdition } from "@/api/editions/types";
import { TopBar } from "@/components/layout/TopBar";
import { pageMeta } from "@/lib/pageHead";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/festivals/$festivalSlug/")({
  component: EditionSelection,
  head: ({ match }) => ({
    meta: pageMeta({
      title: "Select Edition",
      prefix: match.context.festival?.name,
    }),
  }),
  beforeLoad: async ({ params, context }) => {
    const editions = await context.queryClient.ensureQueryData(
      editionsForFestivalQuery(context.festival.id),
    );

    if (editions.length === 1) {
      throw redirect({
        to: "/festivals/$festivalSlug/editions/$editionSlug",
        params: {
          festivalSlug: params.festivalSlug,
          editionSlug: editions[0].slug,
        },
      });
    }
  },
});

function EditionSelection() {
  const { festival } = Route.useRouteContext();
  const { data: availableEditions } = useSuspenseQuery(
    editionsForFestivalQuery(festival.id),
  );

  if (availableEditions.length === 0) {
    return (
      <div className="min-h-screen">
        <div className="container mx-auto px-4 py-8">
          <TopBar showBackButton backLabel="Back to Festivals" />
          <h1 className="text-4xl font-bold text-foreground text-center mb-8">
            {festival.name}
          </h1>

          <div className="flex items-center justify-center mt-16">
            <Card className="w-full max-w-md bg-surface border-border">
              <CardHeader className="text-center">
                <Calendar className="h-16 w-16 mx-auto text-accent mb-4" />
                <CardTitle className="text-foreground">
                  No Editions Available
                </CardTitle>
                <CardDescription className="text-muted-foreground">
                  There are currently no editions of {festival.name} open for
                  voting.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="outline" asChild className="w-full">
                  <Link to="/">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back to Festivals
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  function formatDate(dateString: string) {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  }

  function getEditionStatus(edition: FestivalEdition) {
    const now = new Date();
    const startDate = new Date(edition.start_date || "");
    const endDate = new Date(edition.end_date || "");

    if (now < startDate) {
      return { status: "upcoming", label: "Upcoming", color: "blue" };
    } else if (now >= startDate && now <= endDate) {
      return { status: "live", label: "Live Now", color: "green" };
    } else {
      return { status: "ended", label: "Ended", color: "gray" };
    }
  }

  return (
    <div className="min-h-screen">
      <div className="container mx-auto px-4 py-8">
        <AppHeader
          showBackButton
          backLabel="Back to Festivals"
          title={festival.name}
          logoUrl={festival.logo_url}
          showGroupsButton
        />

        <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {availableEditions.map((edition) => {
            const editionStatus = getEditionStatus(edition);

            const linkPath = `/festivals/${festival.slug}/editions/${edition.slug}`;

            return (
              <Link key={edition.id} to={linkPath} className="block">
                <Card className="bg-surface border-border hover:bg-surface-active transition-all duration-300 cursor-pointer group">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-foreground text-xl mb-2 group-hover:text-accent transition-colors">
                          {edition.name}
                        </CardTitle>
                        <CardDescription className="text-muted-foreground text-sm">
                          {edition.year}
                        </CardDescription>
                        {edition.description && (
                          <CardDescription className="text-muted-foreground text-sm mt-2">
                            {edition.description}
                          </CardDescription>
                        )}
                      </div>
                      <Badge
                        variant="secondary"
                        className={cn(
                          editionStatus.color === "green" &&
                            "bg-live/15 text-live-foreground border-live/40",
                          editionStatus.color === "blue" &&
                            "bg-vote-interested-soft text-vote-interested-foreground border-vote-interested/40",
                          editionStatus.color === "gray" &&
                            "bg-vote-skip-soft text-vote-skip-foreground border-vote-skip/40",
                        )}
                      >
                        {editionStatus.label}
                      </Badge>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    <div className="space-y-2 text-sm text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        <span>
                          {formatDate(edition.start_date || "")} -{" "}
                          {formatDate(edition.end_date || "")}
                        </span>
                      </div>

                      {edition.location && (
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4" />
                          <span>{edition.location}</span>
                        </div>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <Badge
                        variant="secondary"
                        className="bg-accent-soft text-accent-soft-foreground border-accent/40"
                      >
                        <Users className="h-3 w-3 mr-1" />
                        Community Voting
                      </Badge>

                      {edition.is_active && (
                        <Badge
                          variant="secondary"
                          className="bg-vote-must-soft text-vote-must-foreground border-vote-must/40"
                        >
                          <Clock className="h-3 w-3 mr-1" />
                          Active
                        </Badge>
                      )}
                    </div>

                    <Button asChild className="w-full mt-4">
                      <span>Select Edition</span>
                    </Button>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>

        <div className="mt-16 text-center">
          <p className="text-muted-foreground text-sm">
            Vote on your favorite artists and collaborate with your community
          </p>
        </div>
      </div>
    </div>
  );
}
