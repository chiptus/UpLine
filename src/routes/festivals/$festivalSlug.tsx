import {
  createFileRoute,
  notFound,
  Link,
  Outlet,
} from "@tanstack/react-router";
import { festivalBySlugQuery } from "@/api/festivals/useFestivalBySlug";
import { festivalInfoQuery } from "@/api/festival-info/useFestivalInfo";
import { customLinksQuery } from "@/api/custom-links/useCustomLinks";
import { pageMeta } from "@/lib/pageHead";
import { SupabaseNotFoundError } from "@/lib/supabaseErrors";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/festivals/$festivalSlug")({
  onError: (error) => {
    if (error instanceof SupabaseNotFoundError) {
      throw notFound();
    }
    throw error;
  },
  beforeLoad: async ({ params, context }) => {
    const festival = await context.queryClient.ensureQueryData(
      festivalBySlugQuery(params.festivalSlug),
    );
    return { festival };
  },
  loader: async ({ context }) => {
    void context.queryClient.ensureQueryData(
      festivalInfoQuery(context.festival.id),
    );
    void context.queryClient.ensureQueryData(
      customLinksQuery(context.festival.id),
    );
  },
  component: () => <Outlet />,
  notFoundComponent: FestivalNotFound,
  head: ({ match }) => ({
    meta: pageMeta({ title: match.context.festival?.name }),
  }),
});

function FestivalNotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="text-center text-foreground">
        <h1 className="text-2xl font-bold mb-4">Festival not found</h1>
        <p className="mb-6 text-muted-foreground">
          We couldn&apos;t find that festival. It may have been removed or the
          link may be incorrect.
        </p>
        <Button asChild>
          <Link to="/">Back to festivals</Link>
        </Button>
      </div>
    </div>
  );
}
