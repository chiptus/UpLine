// PROTOTYPE (timeline nav & filtering) — throwaway, delete with this folder.
//
// Fakes "now" to ~60% into the edition window (evening prime time) so the Now button and the
// current-time indicator are demoable regardless of the real date. Advances
// in real time and ticks every 60s, like the real indicator would.
// The real implementation uses the actual clock and hides both when the
// current time is outside the festival window.
import { useEffect, useRef, useState } from "react";

export function useFakeNow(
  windowStart: Date | null,
  windowEnd: Date | null,
): Date | null {
  const [, setTick] = useState(0);
  const anchorRef = useRef(Date.now());

  useEffect(() => {
    const id = window.setInterval(() => setTick((t) => t + 1), 60_000);
    return () => window.clearInterval(id);
  }, []);

  if (!windowStart || !windowEnd || windowEnd <= windowStart) return null;

  const base =
    windowStart.getTime() +
    (windowEnd.getTime() - windowStart.getTime()) * 0.6;
  const now = base + (Date.now() - anchorRef.current);
  return new Date(Math.floor(now / 60_000) * 60_000);
}
