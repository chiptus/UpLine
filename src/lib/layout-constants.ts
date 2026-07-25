// Shared sticky-offset constants so sticky bars (timeline toolbar/header
// strip, list-view day headers) derive their `top` from one source instead
// of scattered magic numbers.

export const TOP_BAR_HEIGHT_PX = { mobile: 64, desktop: 80 } as const;

// Tailwind utility classes matching TOP_BAR_HEIGHT_PX (the fixed top bar's
// `h-16 md:h-20` spacer in TopBar.tsx) — used by sticky elements docking
// directly below it (timeline toolbar/header strip, list day headers).
export const STICKY_TOP_BELOW_TOP_BAR_CLASS = "top-16 md:top-20";

// The timeline toolbar (TimelineToolbar.tsx) sits at the very top of its
// scroll region (above everything else), so the header strip below it
// stacks on top of the toolbar's own height.
// Measured from the rendered toolbar (padding + border + content).
export const TIMELINE_TOOLBAR_HEIGHT_PX = { mobile: 63, desktop: 63 } as const;

// Used by the timeline header strip (TimeScaleContainer.tsx) to dock below
// the toolbar. Measured from the rendered toolbar (padding + border +
// content).
export const HEADER_STRIP_TOP_PX = {
  mobile: TOP_BAR_HEIGHT_PX.mobile + TIMELINE_TOOLBAR_HEIGHT_PX.mobile,
  desktop: TOP_BAR_HEIGHT_PX.desktop + TIMELINE_TOOLBAR_HEIGHT_PX.desktop,
} as const;

// Tailwind classes matching HEADER_STRIP_TOP_PX, expressed responsively so
// the offset doesn't depend on a JS media-query hook (which starts at
// `false` and would flash the desktop offset on mobile before settling).
// Written as a literal string (not interpolated from the px constants
// above) so Tailwind's static class scanner can pick it up.
export const HEADER_STRIP_TOP_CLASS = "top-[127px] md:top-[143px]";
