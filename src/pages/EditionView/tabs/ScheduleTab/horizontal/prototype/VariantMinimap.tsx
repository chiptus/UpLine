// PROTOTYPE (timeline nav & filtering) — throwaway, delete with this folder.
//
// Variant C — "Mini-map":
// a proportional overview strip of the whole festival (day boundaries, set
// density per stage, voted sets in vote colors) with a draggable viewport
// window; click anywhere on the map to jump (smooth). Compact icon-only vote
// chips live in the mini-map header. Collapsed by default — what testers
// actually valued was one control doing both "jump to a day" and "filter by
// my votes," not the density map being visually loud all the time — so the
// default view is a slim day-button strip (like variant a) with a toggle to
// reveal the full map for people who want the richer overview.
import { useEffect, useRef, useState } from "react";
import { Clock, Map } from "lucide-react";
import { PrototypeCanvas } from "./PrototypeCanvas";
import { PrototypeFilters } from "./PrototypeFilters";
import { VoteChips } from "./VoteChips";
import {
  useScrollToUrl,
  PX_PER_MINUTE,
  CONTENT_OFFSET_PX,
} from "./useScrollToUrl";
import { isNowInWindow, type VariantProps } from "./types";
import { DEFAULT_STAGE_COLOR } from "@/lib/constants/stages";

const MAP_HEIGHT_PX = 64;
const MAP_LABEL_SPACE_PX = 16;

const VOTE_HEX: Record<number, string> = {
  2: "#ea580c", // orange-600, Must Go
  1: "#2563eb", // blue-600, Interested
  [-1]: "#4b5563", // gray-600, Won't Go
};

interface VariantMinimapProps extends VariantProps {
  getVote: (setId: string) => number | undefined;
}

export function VariantMinimap({
  timelineData,
  timezone,
  days,
  now,
  mountFallback,
  voteFilter,
  onToggleVote,
  onClearVotes,
  getVote,
}: VariantMinimapProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<HTMLDivElement>(null);
  const [viewport, setViewport] = useState({ left: 0, width: 0 });
  const [mapWidth, setMapWidth] = useState(0);
  const [showMap, setShowMap] = useState(false);

  const { jumpToCenter, jumpToLeftEdge } = useScrollToUrl({
    scrollRef,
    festivalStart: timelineData.festivalStart,
    timezone,
    smooth: true,
    mountFallbackLeftEdge: mountFallback,
  });

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    function update() {
      setViewport({ left: el!.scrollLeft, width: el!.clientWidth });
      setMapWidth(mapRef.current?.clientWidth ?? 0);
    }

    update();
    el.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      el.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
    // re-measure mapRef once it mounts (showMap flips true -> element exists)
  }, [showMap]);

  const scale = mapWidth > 0 ? mapWidth / timelineData.totalWidth : 0;
  const showNow = isNowInWindow(now, timelineData);
  const nowX = showNow
    ? (((now.getTime() - timelineData.festivalStart.getTime()) / 60_000) *
        PX_PER_MINUTE +
        CONTENT_OFFSET_PX) *
      scale
    : 0;
  const stageCount = timelineData.stages.length;
  const rowHeight =
    stageCount > 0
      ? Math.max(
          3,
          Math.floor((MAP_HEIGHT_PX - MAP_LABEL_SPACE_PX - 4) / stageCount),
        )
      : 4;

  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-3">
            <PrototypeFilters
              voteFilterCount={voteFilter.length}
              onClearVotes={onClearVotes}
            />
            <button
              type="button"
              onClick={() => setShowMap((v) => !v)}
              className="inline-flex items-center gap-1.5 text-xs uppercase tracking-wide text-purple-400 hover:text-purple-200"
            >
              <Map className="h-3.5 w-3.5" />
              {showMap ? "Hide overview" : "Show overview"}
            </button>
          </div>
          <div className="flex items-center gap-2">
            <VoteChips compact selected={voteFilter} onToggle={onToggleVote} />
            {showNow && (
              <button
                type="button"
                className="inline-flex items-center gap-1 rounded-full bg-fuchsia-600 px-2.5 py-1 text-xs font-medium text-white hover:bg-fuchsia-500"
                onClick={() => jumpToCenter(now)}
              >
                <Clock className="h-3 w-3" />
                Now
              </button>
            )}
          </div>
        </div>

        {showMap ? (
          <div
            ref={mapRef}
            className="relative w-full cursor-pointer touch-none select-none overflow-hidden rounded-lg border border-purple-400/30 bg-purple-950/60"
            style={{ height: MAP_HEIGHT_PX }}
            onPointerDown={handleMapPointerDown}
          >
            {days.map((day) => (
              <div
                key={day.key}
                className="absolute inset-y-0 border-l border-white/15"
                style={{ left: `${timeToMapX(day.start)}px` }}
              >
                <span className="absolute left-1 top-0.5 text-[9px] uppercase text-purple-300">
                  {day.label}
                </span>
              </div>
            ))}

            {timelineData.stages.map((stage, row) =>
              stage.sets.map((set) => {
                if (!set.horizontalPosition) return null;
                const vote = getVote(set.id);
                const voteColor =
                  vote !== undefined ? VOTE_HEX[vote] : undefined;
                return (
                  <div
                    key={set.id}
                    className="absolute rounded-[1px]"
                    style={{
                      left: `${
                        (set.horizontalPosition.left + CONTENT_OFFSET_PX) *
                        scale
                      }px`,
                      width: `${Math.max(
                        2,
                        set.horizontalPosition.width * scale,
                      )}px`,
                      top: MAP_LABEL_SPACE_PX + row * rowHeight,
                      height: rowHeight - 1,
                      backgroundColor:
                        voteColor ?? stage.color ?? DEFAULT_STAGE_COLOR,
                      opacity: voteColor ? 1 : 0.4,
                    }}
                  />
                );
              }),
            )}

            {showNow && (
              <div
                className="absolute inset-y-0 w-0.5 bg-fuchsia-400"
                style={{ left: `${nowX}px` }}
              />
            )}

            <div
              className="absolute inset-y-0 cursor-grab rounded border-2 border-white/80 bg-white/10 active:cursor-grabbing"
              style={{
                left: `${viewport.left * scale}px`,
                width: `${Math.max(8, viewport.width * scale)}px`,
              }}
              onPointerDown={handleWindowPointerDown}
            />
          </div>
        ) : (
          <div className="flex flex-wrap items-center gap-1 rounded-lg border border-purple-400/20 bg-purple-950/80 px-2 py-1.5">
            {days.map((day) => (
              <button
                key={day.key}
                type="button"
                className="rounded-md px-2.5 py-1 text-xs text-purple-200 hover:bg-purple-600/40 hover:text-white"
                onClick={() => jumpToLeftEdge(day.start)}
              >
                {day.label}
              </button>
            ))}
          </div>
        )}
      </div>

      <PrototypeCanvas
        timelineData={timelineData}
        timezone={timezone}
        scrollRef={scrollRef}
        now={now}
        nowTreatment="dashed"
      />
    </div>
  );

  function timeToMapX(t: Date) {
    return (
      (((t.getTime() - timelineData.festivalStart.getTime()) / 60_000) *
        PX_PER_MINUTE +
        CONTENT_OFFSET_PX) *
      scale
    );
  }

  function handleMapPointerDown(e: React.PointerEvent<HTMLDivElement>) {
    if (!mapRef.current || scale === 0) return;
    const rect = mapRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const minutes = (x / scale - CONTENT_OFFSET_PX) / PX_PER_MINUTE;
    jumpToCenter(
      new Date(timelineData.festivalStart.getTime() + minutes * 60_000),
    );
  }

  function handleWindowPointerDown(e: React.PointerEvent<HTMLDivElement>) {
    e.stopPropagation();
    const el = scrollRef.current;
    if (!el || scale === 0) return;
    const windowEl = e.currentTarget;
    windowEl.setPointerCapture(e.pointerId);
    const startX = e.clientX;
    const startScrollLeft = el.scrollLeft;

    function onMove(ev: PointerEvent) {
      el!.scrollLeft = startScrollLeft + (ev.clientX - startX) / scale;
    }
    function onUp() {
      windowEl.removeEventListener("pointermove", onMove);
      windowEl.removeEventListener("pointerup", onUp);
    }

    windowEl.addEventListener("pointermove", onMove);
    windowEl.addEventListener("pointerup", onUp);
  }
}
