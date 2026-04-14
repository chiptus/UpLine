import { Link, useParams } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Music } from "lucide-react";

export function ArtistNotFoundState() {
  const { festivalSlug, editionSlug } = useParams({
    from: "/festivals/$festivalSlug/editions/$editionSlug/sets/$setSlug",
  });
  return (
    <div className="min-h-screen bg-app-gradient flex items-center justify-center">
      <div className="text-center">
        <Music className="h-16 w-16 text-purple-400 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-white mb-4">Set not found</h2>
        <Link
          to="/festivals/$festivalSlug/editions/$editionSlug/sets"
          params={{ festivalSlug, editionSlug }}
        >
          <Button className="bg-purple-600 hover:bg-purple-700">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Sets
          </Button>
        </Link>
      </div>
    </div>
  );
}
