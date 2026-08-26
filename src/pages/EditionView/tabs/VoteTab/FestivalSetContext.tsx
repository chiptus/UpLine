import { createContext, useContext, ReactNode } from "react";
import { FestivalSet } from "@/api/sets/types";

interface FestivalSetContextValue {
  set: FestivalSet;
  onLockSort(): void;
}

const FestivalSetContext = createContext<FestivalSetContextValue | null>(null);

interface FestivalSetProviderProps {
  children: ReactNode;
  set: FestivalSet;
  onLockSort(): void;
}

export function FestivalSetProvider({
  children,
  set,
  onLockSort,
}: FestivalSetProviderProps) {
  const contextValue: FestivalSetContextValue = {
    set,
    onLockSort,
  };

  return (
    <FestivalSetContext.Provider value={contextValue}>
      {children}
    </FestivalSetContext.Provider>
  );
}

export function useFestivalSet() {
  const context = useContext(FestivalSetContext);
  if (!context) {
    throw new Error("useFestivalSet must be used within a FestivalSetProvider");
  }
  return context;
}
