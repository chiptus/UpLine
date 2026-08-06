# Current Edition at Subdomain Root

This project does not serve a festival's current edition at its subdomain root (`tomorrowland.getupline.com`) instead of the `/editions/2026` path. Every edition-scoped URL keeps the explicit `/editions/$editionSlug` segment.

## Why this is out of scope

The feature itself was scoped cleanly during grilling: "current edition" would be an explicit, admin-controlled concept — the existing (currently dormant) `is_active` boolean on `festival_editions`, not something derived from dates. That part isn't the problem. The problem is _how_ a bare short URL (`tomorrowland.getupline.com/schedule`, not `tomorrowland.getupline.com/editions/2026/schedule`) can actually resolve to the right edition, and every implementation path we found has a permanent, unappealing cost:

**Option: duplicate the edition route tree.** Give every route under `.../editions/$editionSlug/**` (12 files: `schedule.tsx`, `schedule/{list,now,timeline}.tsx`, `sets.tsx`, `sets/{index,$setSlug}.tsx`, `map.tsx`, `info.tsx`, `explore.tsx`, `social.tsx`, plus the `$editionSlug.tsx` layout) a sibling file directly under `.../festivals/$festivalSlug/**` that resolves the current edition via its own loader instead of a URL param. This is TanStack Router's natural per-route data-loading mechanism — no staleness problem, no boot-time cost — but it means every future edition-view route needs a human to remember to add its short-URL twin. That can be guarded with a route-file-parity test, but the underlying duplication (two files per feature, forever) doesn't go away.

**Option: rewrite-level URL mapping.** Extend `main.tsx`'s `rewrite.input`/`rewrite.output` (which already prefix subdomain paths into `/festivals/$slug/...` — see the reserved-top-level-segment logic added for issue #270) to also transparently map bare short paths onto the existing `/editions/$editionSlug/*` routes, using a `festivalSlug → currentEditionSlug` lookup. This avoids file duplication entirely, but runs into a structural wall: TanStack Router matches routes on the pathname _before_ any loader executes, so the rewrite has to resolve the current-edition mapping _synchronously_, before route matching. This app is a plain static SPA (see `vercel.json` — a catch-all rewrite to `index.html`, no edge middleware, no server logic; confirmed in `src/lib/subdomain.ts` that all subdomain resolution already happens client-side). With no edge/server layer to do that resolution ahead of the client, the only way to give `rewrite.input` synchronous data is a blocking network fetch in module scope before the router is even constructed — meaning every fresh load of any subdomain page pays a network round-trip before anything can render, permanently. The alternative — standing up real edge middleware to resolve the mapping server-side — is a materially bigger infrastructure project than this ticket, not a tuning knob.

Neither option is a temporary complexity we could design away with more effort; both costs are structural to the current architecture (file-based routing + no edge layer). We're not pursuing either for now.

```ts
// main.tsx — the existing rewrite already runs synchronously, pre-match,
// with only the URL to work with (no query client, no async):
rewrite: {
  input: ({ url }) => {
    // ...
    url.pathname = `/festivals/${subdomain}${url.pathname}`;
    return url;
  },
  // ...
}
```

If the cost calculus changes — e.g. this project adopts an edge/server layer for other reasons, making synchronous server-side resolution "free" — this is worth revisiting via the rewrite-level option.

## Prior requests

- #285 — "enhancement: serve current edition at festival subdomain root"
