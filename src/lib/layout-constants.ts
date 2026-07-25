// Shared sticky-offset constants so sticky bars (timeline toolbar/header
// strip, list-view day headers) derive their `top` from one source instead
// of scattered magic numbers.

export const TOP_BAR_HEIGHT_PX = { mobile: 64, desktop: 80 } as const;

// Tailwind utility classes matching TOP_BAR_HEIGHT_PX (the fixed top bar's
// `h-16 md:h-20` spacer in TopBar.tsx) — used by sticky elements docking
// directly below it (timeline toolbar/header strip, list day headers).
export const STICKY_TOP_BELOW_TOP_BAR_CLASS = "top-16 md:top-20";

// The Now/Timeline/List switcher (ScheduleNavigation) is sticky just below
// the top bar, above the Outlet content, on every schedule view — so
// anything sticky inside the Outlet (timeline toolbar/header strip, list
// day headers) must dock below it too. Given a fixed height (rather than
// letting padding/content determine it) so this constant is exact, not a
// guess — ScheduleNavigation applies SWITCHER_HEIGHT_CLASS below and must
// stay in sync with these numbers.
export const SWITCHER_HEIGHT_PX = { mobile: 56, desktop: 64 } as const;

// Tailwind height classes matching SWITCHER_HEIGHT_PX exactly — applied to
// ScheduleNavigation's sticky container.
export const SWITCHER_HEIGHT_CLASS = "h-14 md:h-16";

export const STICKY_TOP_BELOW_SWITCHER_PX = {
  mobile: TOP_BAR_HEIGHT_PX.mobile + SWITCHER_HEIGHT_PX.mobile,
  desktop: TOP_BAR_HEIGHT_PX.desktop + SWITCHER_HEIGHT_PX.desktop,
} as const;

// Tailwind class equivalent of STICKY_TOP_BELOW_SWITCHER_PX (written as a
// literal so Tailwind's content scanner can statically find it — must stay
// in sync with STICKY_TOP_BELOW_SWITCHER_PX above), for sticky elements that
// don't otherwise need a JS media-query (toolbar, day header).
export const STICKY_TOP_BELOW_SWITCHER_CLASS = "top-[120px] md:top-[144px]";

// The timeline toolbar sits at the very top of its scroll region (above
// everything else), so the header strip below it stacks on top of the
// toolbar's own height.
export const TIMELINE_TOOLBAR_HEIGHT_PX = { mobile: 52, desktop: 52 } as const;
