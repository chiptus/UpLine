import { createContext, PropsWithChildren, useContext, useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Festival } from "@/api/festivals/types";
import { useFestivalEditionBySlugQuery } from "@/api/editions/useFestivalEditionBySlug";
import { FestivalEdition } from "@/api/editions/types";
import { TopBar } from "@/components/layout/TopBar";
import { useToast } from "@/hooks/use-toast";

interface FestivalEditionContextType {
  festival: Festival;
  edition: FestivalEdition | null;
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

interface FestivalEditionProviderProps {
  festival: Festival;
  editionSlug?: string;
}

export function FestivalEditionProvider({
  children,
  festival,
  editionSlug = "",
}: PropsWithChildren<FestivalEditionProviderProps>) {
  const navigate = useNavigate();
  const { toast } = useToast();

  const editionQuery = useFestivalEditionBySlugQuery({
    festivalSlug: festival.slug,
    editionSlug,
  });

  const edition = editionQuery.data ?? null;

  const contextValue: FestivalEditionContextType = {
    festival,
    edition,
  };

  useEffect(() => {
    if (editionQuery.error) {
      toast({
        title: "Festival edition not found",
        description: `Festival edition with slug ${editionSlug} not found`,
        variant: "destructive",
      });
      navigate({ to: "/" });
    }
  }, [editionQuery.error, toast, editionSlug, navigate]);

  if (editionQuery.error) {
    return (
      <FestivalEditionContext.Provider value={contextValue}>
        <div className="min-h-screen bg-app-gradient">
          <div className="container mx-auto px-4 py-8">
            <TopBar backLabel="Back to Festivals" />
            <h1 className="text-4xl font-bold text-white text-center mb-8">
              No valid festival edition found
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
