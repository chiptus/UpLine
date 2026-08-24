import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { Link, useParams } from "@tanstack/react-router";

export function EmptyState() {
  const { festivalSlug, editionSlug } = useParams({
    from: "/festivals/$festivalSlug/editions/$editionSlug/explore",
  });
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <div className="text-foreground text-center">
        <h1 className="text-2xl font-bold mb-4">No Sets Available</h1>
        <p className="mb-6">
          You have explored all available sets in this edition
        </p>
        <Button asChild variant="outline">
          <Link
            to="/festivals/$festivalSlug/editions/$editionSlug/sets"
            params={{ festivalSlug, editionSlug }}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Go Back
          </Link>
        </Button>
      </div>
    </div>
  );
}
