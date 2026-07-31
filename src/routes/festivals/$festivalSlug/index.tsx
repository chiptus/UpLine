import { createFileRoute, redirect } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { festivalBySlugQuery } from "@/api/festivals/useFestivalBySlug";
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
import { useFestivalEdition } from "@/contexts/FestivalEditionContext";
import { AppHeader } from "@/components/layout/AppHeader";
import { Link } from "@tanstack/react-router";
import { FestivalEdition } from "@/api/editions/types";
import { TopBar } from "@/components/layout/TopBar";

export const Route = createFileRoute("/festivals/$festivalSlug/")({
  component: EditionSelection,
  beforeLoad: async ({ params, context }) => {
    const festival = await context.queryClient.ensureQueryData(
      festivalBySlugQuery(params.festivalSlug),
    );
    const editions = await context.queryClient.ensureQueryData(
      editionsForFestivalQuery(festival.id),
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
  const { festival } = useFestivalEdition();
  const { data: availableEditions } = useSuspenseQuery(
    editionsForFestivalQuery(festival.id),
  );

  if (availableEditions.length === 0) {
    return (
      <div className="min-h-screen bg-app-gradient">
        <div className="container mx-auto px-4 py-8">
          <TopBar showBackButton backLabel="Back to Festivals" />
          <h1 className="text-4xl font-bold text-white text-center mb-8">
            {festival.name}
          </h1>

          <div className="flex items-center justify-center mt-16">
            <Card className="w-full max-w-md bg-white/10 border-purple-400/30">
              <CardHeader className="text-center">
                <Calendar className="h-16 w-16 mx-auto text-purple-400 mb-4" />
                <CardTitle className="text-white">
                  No Editions Available
                </CardTitle>
                <CardDescription className="text-purple-200">
                  There are currently no editions of {festival.name} open for
                  voting.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  variant="outline"
                  asChild
                  className="w-full border-purple-400 text-purple-400 hover:bg-purple-400 hover:text-white"
                >
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
    <div className="min-h-screen bg-app-gradient">
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
              <Link key={festival.id} to={linkPath} className="block">
                <Card
                  key={edition.id}
                  className="bg-white/10 border-purple-400/30 hover:bg-white/15 transition-all duration-300 cursor-pointer group"
                >
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-white text-xl mb-2 group-hover:text-purple-200 transition-colors">
                          {edition.name}
                        </CardTitle>
                        <CardDescription className="text-purple-200 text-sm">
                          {edition.year}
                        </CardDescription>
                        {edition.description && (
                          <CardDescription className="text-purple-200 text-sm mt-2">
                            {edition.description}
                          </CardDescription>
                        )}
                      </div>
                      <Badge
                        variant="secondary"
                        className={`
                        ${editionStatus.color === "green" ? "bg-green-600/50 text-green-100 border-green-500/50" : ""}
                        ${editionStatus.color === "blue" ? "bg-blue-600/50 text-blue-100 border-blue-500/50" : ""}
                        ${editionStatus.color === "gray" ? "bg-gray-600/50 text-gray-100 border-gray-500/50" : ""}
                      `}
                      >
                        {editionStatus.label}
                      </Badge>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    <div className="space-y-2 text-sm text-purple-200">
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
                        className="bg-purple-600/50 text-purple-100 border-purple-500/50"
                      >
                        <Users className="h-3 w-3 mr-1" />
                        Community Voting
                      </Badge>

                      {edition.is_active && (
                        <Badge
                          variant="secondary"
                          className="bg-orange-600/50 text-orange-100 border-orange-500/50"
                        >
                          <Clock className="h-3 w-3 mr-1" />
                          Active
                        </Badge>
                      )}
                    </div>

                    <Link to={linkPath}>
                      <Button className="w-full mt-4 bg-purple-600 hover:bg-purple-700 text-white border-purple-600">
                        Select Edition
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>

        <div className="mt-16 text-center">
          <p className="text-purple-200 text-sm">
            Vote on your favorite artists and collaborate with your community
          </p>
        </div>
      </div>
    </div>
  );
}
