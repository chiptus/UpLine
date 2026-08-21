import { useEffect } from "react";

const STATIC_HEAD_SELECTORS = [
  "title",
  'meta[name="description"]',
  'meta[property="og:title"]',
  'meta[property="og:description"]',
];

/**
 * index.html ships static title/description/OG tags as a fallback for
 * crawlers and no-JS clients. Once TanStack Router's HeadContent takes
 * over, remove them so they don't linger alongside the route-driven tags.
 */
export function useClearStaticTags() {
  useEffect(() => {
    STATIC_HEAD_SELECTORS.forEach((selector) => {
      document.head.querySelector(selector)?.remove();
    });
  }, []);
}
