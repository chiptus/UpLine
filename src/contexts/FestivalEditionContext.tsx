import { createContext, PropsWithChildren, useContext } from "react";
import { Festival } from "@/api/festivals/types";
import { useFestivalEditionBySlugQuery } from "@/api/editions/useFestivalEditionBySlug";
import { FestivalEdition } from "@/api/editions/types";

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
  editionSlug?: string | undefined;
}

export function FestivalEditionProvider({
  children,
  festival,
  editionSlug = "",
}: PropsWithChildren<FestivalEditionProviderProps>) {
  const editionQuery = useFestivalEditionBySlugQuery({
    editionSlug,
    festivalId: festival.id,
  });

  const edition = editionQuery.data ?? null;

  const contextValue: FestivalEditionContextType = {
    festival,
    edition,
  };

  return (
    <FestivalEditionContext.Provider value={contextValue}>
      {children}
    </FestivalEditionContext.Provider>
  );
}
