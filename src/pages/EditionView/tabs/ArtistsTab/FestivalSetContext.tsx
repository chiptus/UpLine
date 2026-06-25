import { createContext, useContext, ReactNode } from "react";
import { FestivalSet } from "@/api/sets/types";

interface FestivalSetContextValue {
  set: FestivalSet;
  onLockSort(): void;
  use24Hour?: boolean;
}

const FestivalSetContext = createContext<FestivalSetContextValue | null>(null);

interface FestivalSetProviderProps {
  children: ReactNode;
  set: FestivalSet;
  onLockSort(): void;
  use24Hour?: boolean;
}

export function FestivalSetProvider({
  children,
  set,
  onLockSort,
  use24Hour = false,
}: FestivalSetProviderProps) {
  const contextValue: FestivalSetContextValue = {
    set,
    onLockSort,
    use24Hour,
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
