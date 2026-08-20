import { createFileRoute, useParams } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { useFestivalEditionBySlugQuery } from "@/api/editions/useFestivalEditionBySlug";
import { festivalBySlugQuery } from "@/api/festivals/useFestivalBySlug";
import { LinkWizard } from "@/pages/admin/festivals/LinkWizard/LinkWizard";

export const Route = createFileRoute(
  "/admin/festivals/$festivalSlug/editions/$editionSlug/links",
)({
  component: FestivalLinks,
});

function FestivalLinks() {
  const { festivalSlug, editionSlug } = useParams({
    from: "/admin/festivals/$festivalSlug/editions/$editionSlug/links",
  });
  const { data: festival } = useSuspenseQuery(
    festivalBySlugQuery(festivalSlug),
  );
  const editionQuery = useFestivalEditionBySlugQuery({
    editionSlug,
    festivalId: festival.id,
  });

  if (editionQuery.isLoading || !editionQuery.data) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-8">
          <Loader2 className="h-6 w-6 animate-spin mr-2" />
          <span>Loading edition...</span>
        </CardContent>
      </Card>
    );
  }

  return <LinkWizard editionId={editionQuery.data.id} />;
}
