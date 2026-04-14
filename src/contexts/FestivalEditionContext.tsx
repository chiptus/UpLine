import {
  createContext,
  PropsWithChildren,
  useContext,
  useEffect,
  useMemo,
} from "react";
import { useLocation, useNavigate } from "@tanstack/react-router";
import { useFestivalBySlugQuery } from "@/hooks/queries/festivals/useFestivalBySlug";
import { Festival } from "@/hooks/queries/festivals/types";
import { useFestivalEditionBySlugQuery } from "@/hooks/queries/festivals/editions/useFestivalEditionBySlug";
import { FestivalEdition } from "@/hooks/queries/festivals/editions/types";
import { TopBar } from "@/components/layout/TopBar";
import { useToast } from "@/hooks/use-toast";

interface FestivalEditionContextType {
  // Current state
  festival: Festival | null;
  edition: FestivalEdition | null;

  // Utils
  isContextReady: boolean;
  basePath: string;
}

const FestivalEditionContext = createContext<
  FestivalEditionContextType | undefined
>(undefined);

export function useFestivalEdition() {
  const context = useContext(FestivalEditionContext);
  if (context === undefined) {
    throw new Error(
      "useFestivalEdition must be used within a FestivalEditionProvider",
    );
  }
  return context;
}

function useParseSlugs() {
  const { pathname } = useLocation();

  return useMemo(() => {
    const festivalMatch = pathname.match(/^\/festivals\/([^/]+)/);
    const editionMatch = pathname.match(/^\/festivals\/[^/]+\/editions\/([^/]+)/);

    const festivalSlug = festivalMatch?.[1] ?? "";
    const editionSlug = editionMatch?.[1] ?? "";

    let basePath = "";
    if (festivalSlug) {
      basePath = `/festivals/${festivalSlug}`;
      if (editionSlug) basePath += `/editions/${editionSlug}`;
    }

    return { festivalSlug, editionSlug, basePath };
  }, [pathname]);
}

export function FestivalEditionProvider({
  children,
}: PropsWithChildren<unknown>) {
  const { festivalSlug, editionSlug, basePath } = useParseSlugs();
  const navigate = useNavigate();

  const festivalQuery = useFestivalBySlugQuery(festivalSlug);

  const editionQuery = useFestivalEditionBySlugQuery({
    festivalSlug,
    editionSlug,
  });

  const festival = festivalQuery.data;
  const edition = editionQuery.data;

  const isContextReady = !!(
    // Either we're on root (no context needed)
    (
      (!festivalSlug && !editionSlug) ||
      // Or we have valid festival context
      (festivalSlug && festival) ||
      // Or we have valid edition context
      (editionSlug && edition && festival)
    )
  );

  const contextValue: FestivalEditionContextType = {
    festival: festival || null,
    edition: edition || null,
    isContextReady,
    basePath,
  };
  const { toast } = useToast();
  useEffect(() => {
    if (festivalQuery.error) {
      toast({
        title: "Festival not found",
        description: `Festival with slug ${festivalSlug} not found`,
        variant: "destructive",
      });
    }
  }, [festivalQuery.error, toast, festivalSlug]);

  useEffect(() => {
    if (editionQuery.error) {
      toast({
        title: "Festival edition not found",
        description: `Festival edition with slug ${editionSlug} not found`,
        variant: "destructive",
      });
    }
  }, [editionQuery.error, toast, editionSlug]);

  useEffect(() => {
    if (festivalQuery.error || editionQuery.error) {
      navigate({ to: "/" });
    }
  }, [festivalQuery.error, editionQuery.error, navigate]);

  if (festivalQuery.error || editionQuery.error) {
    return (
      <FestivalEditionContext.Provider value={contextValue}>
        <div className="min-h-screen bg-app-gradient">
          <div className="container mx-auto px-4 py-8">
            <TopBar backLabel="Back to Festivals" />
            <h1 className="text-4xl font-bold text-white text-center mb-8">
              No valid festival or edition found
            </h1>
          </div>
        </div>
      </FestivalEditionContext.Provider>
    );
  }

  return (
    <FestivalEditionContext.Provider value={contextValue}>
      {children}
    </FestivalEditionContext.Provider>
  );
}
