import { useCallback, useRef } from "react";
import { TopBar } from "@/components/layout/TopBar";
import { FestivalIndicator } from "@/components/layout/AppHeader/FestivalIndicator";
import { useScrollVisibility } from "@/hooks/useScrollVisibility";
import { EditionHero } from "./EditionHero";

interface EditionHeaderProps {
  title: string;
  logoUrl?: string | null;
}

export function EditionHeader({ title, logoUrl }: EditionHeaderProps) {
  const rowRef = useRef<HTMLElement | null>(null);
  const isRowVisible = useScrollVisibility(rowRef, {
    rootMargin: "-80px 0px 0px 0px", // Negative top margin = trigger when the row is 80px from top (behind top bar)
  });
  const handleRowRefChange = useCallback((node: HTMLElement | null) => {
    rowRef.current = node;
  }, []);

  return (
    <>
      <TopBar showGroupsButton>
        <FestivalIndicator
          isTitleVisible={isRowVisible}
          logoUrl={logoUrl}
          title={title}
        />
      </TopBar>

      <EditionHero
        title={title}
        logoUrl={logoUrl}
        onRowRefChange={handleRowRefChange}
      />
    </>
  );
}
