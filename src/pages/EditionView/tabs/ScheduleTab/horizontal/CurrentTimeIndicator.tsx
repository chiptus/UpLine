interface CurrentTimeIndicatorProps {
  left: number;
}

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
