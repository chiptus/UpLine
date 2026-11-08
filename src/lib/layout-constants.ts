// Tailwind classes are written as literal strings so the static class scanner
// finds them. They all reference `--top-bar-height` (defined in index.css) so
// the top bar's height has one definition that CSS and JS can't desync from.

// Spacer reserving room for the fixed top bar (TopBar.tsx).
export const TOP_BAR_SPACER_CLASS = "h-[var(--top-bar-height)]";

// For sticky elements docking directly below the top bar (timeline toolbar,
// list day headers).
export const STICKY_TOP_BELOW_TOP_BAR_CLASS = "top-[var(--top-bar-height)]";

// For scrollIntoView targets that must not land underneath the top bar.
export const SCROLL_MT_BELOW_TOP_BAR_CLASS =
  "scroll-mt-[var(--top-bar-height)]";

// Timeline header strip docks below the top bar plus the toolbar. The toolbar
// height is measured at runtime and supplied via this custom property (see
// TimeScaleContainer) because it depends on content and text scale.
export const TIMELINE_TOOLBAR_HEIGHT_CSS_VAR = "--timeline-toolbar-height";
export const HEADER_STRIP_TOP_CLASS =
  "top-[calc(var(--top-bar-height)+var(--timeline-toolbar-height,0px))]";
