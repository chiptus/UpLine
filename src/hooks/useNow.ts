import { useEffect, useState } from "react";

const DEFAULT_INTERVAL_MS = 60_000;

/**
 * Ticks a fresh `Date` on a fixed interval (60s by default). The Now pill and
 * the current-time indicator on the Timeline need a live "now" to re-render
 * against; the pure functions they feed (`isNowWithinFestivalWindow`,
 * `resolveTimelineMountMoment`, `timeToOffset`) never call `new Date()`
 * themselves - this hook is the one place that does, on their behalf.
 */
export function useNow(intervalMs = DEFAULT_INTERVAL_MS): Date {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), intervalMs);
    return () => window.clearInterval(id);
  }, [intervalMs]);

  return now;
}
