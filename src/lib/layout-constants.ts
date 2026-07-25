// Shared sticky-offset constants so sticky bars (timeline toolbar/header
// strip, list-view day headers) derive their `top` from one source instead
// of scattered magic numbers.

export const TOP_BAR_HEIGHT_PX = { mobile: 64, desktop: 80 } as const;

// Tailwind utility classes matching TOP_BAR_HEIGHT_PX (the fixed top bar's
// `h-16 md:h-20` spacer in TopBar.tsx) — used by sticky elements docking
// directly below it (timeline toolbar/header strip, list day headers).
export const STICKY_TOP_BELOW_TOP_BAR_CLASS = "top-16 md:top-20";

// The timeline toolbar sits at the very top of its scroll region (above
// everything else), so the header strip below it stacks on top of the
// toolbar's own height.
// Measured from the rendered toolbar (padding + border + content), not a
// Tailwind spacing-scale value — re-measure and update by hand if the
// toolbar's own layout changes.
export const TIMELINE_TOOLBAR_HEIGHT_PX = { mobile: 63, desktop: 63 } as const;

export const HEADER_STRIP_TOP_PX = {
  mobile: TOP_BAR_HEIGHT_PX.mobile + TIMELINE_TOOLBAR_HEIGHT_PX.mobile,
  desktop: TOP_BAR_HEIGHT_PX.desktop + TIMELINE_TOOLBAR_HEIGHT_PX.desktop,
} as const;
