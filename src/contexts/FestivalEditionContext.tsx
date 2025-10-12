import {
  createContext,
  PropsWithChildren,
  useContext,
  useEffect,
  useMemo,
} from "react";
import { matchPath, Navigate, useLocation } from "react-router-dom";
import { useFestivalBySlugQuery } from "@/hooks/queries/festivals/useFestivalBySlug";
import { Festival } from "@/hooks/queries/festivals/types";
import { useFestivalEditionBySlugQuery } from "@/hooks/queries/festivals/editions/useFestivalEditionBySlug";
import { FestivalEdition } from "@/hooks/queries/festivals/editions/types";
import { getSubdomainInfo } from "@/lib/subdomain";
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

function getSlugs(pathname: string) {
  // Get festival slug from subdomain or URL path
  const subdomainInfo = getSubdomainInfo();
  let festivalSlug = subdomainInfo.festivalSlug || "";

  console.log("🔍 FestivalEditionContext getSlugs debug:", {
    pathname,
    festivalSlug: subdomainInfo.festivalSlug,
    isSubdomain: subdomainInfo.isSubdomain,
    isMainDomain: subdomainInfo.isMainDomain,
  });

  let basePath = "";
  // For main domain, extract festival slug from URL path
  if (pathname.includes("/festivals/")) {
    const match = matchPath({ path: "/festivals/:festivalSlug/*" }, pathname);
    festivalSlug = match?.params.festivalSlug || festivalSlug || "";
    pathname = pathname.replace(`/festivals/${festivalSlug}`, "");
    basePath = `/festivals/${festivalSlug}`;
  }

  if (!pathname.includes("/editions")) {
    console.log("🔍 No editions in pathname, returning:", { festivalSlug });
    return {
      festivalSlug,
      basePath,
    };
  }

  const matchWithSlash = matchPath(
    { path: "/editions/:editionSlug/*" },
    pathname,
  );

  if (matchWithSlash) {
    const editionSlug = matchWithSlash?.params.editionSlug || "";

    console.log("🔍 Found editions in pathname with slash, returning:", {
      festivalSlug,
      editionSlug,
    });
    return {
      basePath: basePath + `/editions/${editionSlug}`,
      festivalSlug,
      editionSlug,
    };
  }
  const matchWithoutSlash = matchPath(
    { path: "/editions/:editionSlug" },
    pathname,
  );

  const editionSlug = matchWithoutSlash?.params.editionSlug || "";

  console.log("🔍 Found editions in pathname without slash, returning:", {
    festivalSlug,
    editionSlug,
    matchWithoutSlash,
    pathname,
  });
  return {
    basePath: basePath + `/editions/${editionSlug}`,
    festivalSlug,
    editionSlug,
  };
}

function useParseSlugs() {
  const location = useLocation();
  const pathname = location.pathname;

  return useMemo(() => getSlugs(pathname), [pathname]);
}

export function FestivalEditionProvider({
  children,
}: PropsWithChildren<unknown>) {
  const { festivalSlug, editionSlug, basePath } = useParseSlugs();

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

  if (festivalQuery.error || editionQuery.error) {
    return (
      <FestivalEditionContext.Provider value={contextValue}>
        <div className="min-h-screen bg-app-gradient">
          <div className="container mx-auto px-4 py-8">
            <TopBar backLabel="Back to Festivals" />
            <h1 className="text-4xl font-bold text-white text-center mb-8">
              No valid festival or edition found
            </h1>
            <Navigate to="/" />
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
