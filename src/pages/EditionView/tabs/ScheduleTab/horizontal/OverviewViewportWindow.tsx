import { useRef } from "react";
import type { RefObject } from "react";

interface OverviewViewportWindowProps {
  leftPercent: number;
  widthPercent: number;
  mapRef: RefObject<HTMLDivElement>;
  totalWidth: number;
  scrollContainerRef: RefObject<HTMLDivElement>;
}

interface DragState {
  startClientX: number;
  startScrollLeft: number;
  mapWidthPx: number;
}

/**
 * The draggable indicator for the strip's currently visible span.
 *
 * Dragging writes `scrollContainer.scrollLeft` directly on every pointer
 * move, rather than going through `jumpTo`: this is continuous, user-driven
 * scrubbing, not a discrete jump, so there's no target moment to smooth-
 * scroll toward and no reason to re-derive one every pixel. The existing
 * scroll listener in `useTimelineScrollSync` can't tell the difference
 * between this and native scrolling - it debounces whatever `scrollLeft`
 * settles on into the `scrollTo` URL param exactly the same way. That keeps
 * a single write path: this component only ever moves the scroll position,
 * never touches the URL itself.
 */
export function OverviewViewportWindow({
  leftPercent,
  widthPercent,
  mapRef,
  totalWidth,
  scrollContainerRef,
}: OverviewViewportWindowProps) {
  const dragStateRef = useRef<DragState | null>(null);

  return (
    <div
      data-testid="timeline-overview-viewport"
      role="slider"
      aria-label="Visible timeline range"
      aria-valuenow={Math.round(leftPercent)}
      className="absolute top-0 h-full cursor-grab rounded border-2 border-white/80 bg-white/20 active:cursor-grabbing"
      style={{ left: `${leftPercent}%`, width: `${widthPercent}%` }}
      onClick={(event) => event.stopPropagation()}
      onPointerDown={handlePointerDown}
    />
  );

  function handlePointerDown(event: React.PointerEvent<HTMLDivElement>) {
    const map = mapRef.current;
    const container = scrollContainerRef.current;
    if (!map || !container) return;

    event.stopPropagation();
    dragStateRef.current = {
      startClientX: event.clientX,
      startScrollLeft: container.scrollLeft,
      mapWidthPx: map.getBoundingClientRect().width,
    };

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);
  }

  function handlePointerMove(event: PointerEvent) {
    const dragState = dragStateRef.current;
    const container = scrollContainerRef.current;
    if (!dragState || !container || dragState.mapWidthPx <= 0) return;

    const deltaPx = event.clientX - dragState.startClientX;
    const deltaOffset = (deltaPx / dragState.mapWidthPx) * totalWidth;
    const maxScrollLeft = Math.max(0, totalWidth - container.clientWidth);

    container.scrollLeft = Math.max(
      0,
      Math.min(maxScrollLeft, dragState.startScrollLeft + deltaOffset),
    );
  }

  function handlePointerUp() {
    dragStateRef.current = null;
    window.removeEventListener("pointermove", handlePointerMove);
    window.removeEventListener("pointerup", handlePointerUp);
  }
}
