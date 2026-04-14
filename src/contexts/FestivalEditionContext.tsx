import {
  createContext,
  PropsWithChildren,
  useContext,
  useEffect,
} from "react";
import { useNavigate } from "@tanstack/react-router";
import { useFestivalBySlugQuery } from "@/hooks/queries/festivals/useFestivalBySlug";
import { Festival } from "@/hooks/queries/festivals/types";
import { useFestivalEditionBySlugQuery } from "@/hooks/queries/festivals/editions/useFestivalEditionBySlug";
import { FestivalEdition } from "@/hooks/queries/festivals/editions/types";
import { TopBar } from "@/components/layout/TopBar";
import { useToast } from "@/hooks/use-toast";

interface FestivalEditionContextType {
  festival: Festival | null;
  edition: FestivalEdition | null;
  isContextReady: boolean;
  basePath: string;
}

const defaultContext: FestivalEditionContextType = {
  festival: null,
  edition: null,
  isContextReady: true,
  basePath: "/",
};

const FestivalEditionContext = createContext<
  FestivalEditionContextType | undefined
>(undefined);

export function useFestivalEdition() {
  return useContext(FestivalEditionContext) ?? defaultContext;
}

interface FestivalEditionProviderProps {
  festivalSlug: string;
  editionSlug?: string;
}

export function FestivalEditionProvider({
  children,
  festivalSlug,
  editionSlug = "",
}: PropsWithChildren<FestivalEditionProviderProps>) {
  const navigate = useNavigate();

  const festivalQuery = useFestivalBySlugQuery(festivalSlug);
  const editionQuery = useFestivalEditionBySlugQuery({
    festivalSlug,
    editionSlug,
  });

  const festival = festivalQuery.data;
  const edition = editionQuery.data;

  const isContextReady = !!(
    (!festivalSlug && !editionSlug) ||
    (festivalSlug && festival) ||
    (editionSlug && edition && festival)
  );

  let basePath = `/festivals/${festivalSlug}`;
  if (editionSlug) basePath += `/editions/${editionSlug}`;

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
