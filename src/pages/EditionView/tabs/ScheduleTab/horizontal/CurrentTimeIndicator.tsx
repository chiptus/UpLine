interface CurrentTimeIndicatorProps {
  left: number;
}

/**
 * Vertical dashed line marking "now" on the timeline strip - the treatment
 * that tested best in the prototype (see issue #194). Rendered only while
 * `isNowWithinFestivalWindow` is true; its `left` position is recomputed by
 * the caller every 60s (via `useNow`), but the viewport is never scrolled to
 * follow it.
 */
export function CurrentTimeIndicator({ left }: CurrentTimeIndicatorProps) {
  return (
    <div
      data-testid="timeline-now-indicator"
      className="absolute inset-y-0 z-20 pointer-events-none border-l-2 border-dashed border-white/50"
      style={{ left: `${left}px` }}
    >
      <div className="absolute top-0 h-2 w-2 -translate-x-[5px] rounded-full bg-white/80" />
    </div>
  );
}
