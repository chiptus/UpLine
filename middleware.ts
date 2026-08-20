import { next } from "@vercel/edge";

export const config = {
  matcher: ["/festivals/:path*"],
};

const BOT_USER_AGENT_RE =
  /facebookexternalhit|Facebot|Twitterbot|Slackbot|LinkedInBot|WhatsApp|TelegramBot|Discordbot|SkypeUriPreview|iMessageLinkPreview|Applebot|redditbot|Pinterest|vkShare|W3C_Validator|Googlebot/i;

const SET_PATH_RE = /^\/festivals\/([^/]+)\/editions\/([^/]+)\/sets\/([^/]+)/;
const EDITION_PATH_RE = /^\/festivals\/([^/]+)\/editions\/([^/]+)/;
const FESTIVAL_PATH_RE = /^\/festivals\/([^/]+)\/?$/;

interface SocialMeta {
  title: string;
  description: string;
}

export default async function middleware(request: Request) {
  const userAgent = request.headers.get("user-agent") ?? "";
  if (!BOT_USER_AGENT_RE.test(userAgent)) {
    return next();
  }

  const url = new URL(request.url);
  const meta = await resolveSocialMeta(url.pathname);
  if (!meta) {
    return next();
  }

  const indexUrl = new URL("/index.html", url.origin);
  const indexResponse = await fetch(indexUrl);
  if (!indexResponse.ok) {
    return next();
  }

  const html = applySocialMeta(await indexResponse.text(), meta);
  return new Response(html, {
    headers: { "content-type": "text/html; charset=utf-8" },
  });
}

async function resolveSocialMeta(pathname: string): Promise<SocialMeta | null> {
  const setMatch = pathname.match(SET_PATH_RE);
  if (setMatch) {
    return resolveSetMeta(setMatch[1], setMatch[2], setMatch[3]);
  }

  const editionMatch = pathname.match(EDITION_PATH_RE);
  if (editionMatch) {
    return resolveEditionMeta(editionMatch[1], editionMatch[2]);
  }

  const festivalMatch = pathname.match(FESTIVAL_PATH_RE);
  if (festivalMatch) {
    return resolveFestivalMeta(festivalMatch[1]);
  }

  return null;
}

async function resolveFestivalMeta(
  festivalSlug: string,
): Promise<SocialMeta | null> {
  const festival = await fetchFestivalBySlug(festivalSlug);
  if (!festival) return null;

  return {
    title: festival.name,
    description: festival.description || "UpLine - Your Festival companion",
  };
}

async function resolveEditionMeta(
  festivalSlug: string,
  editionSlug: string,
): Promise<SocialMeta | null> {
  const festival = await fetchFestivalBySlug(festivalSlug);
  if (!festival) return null;

  const edition = await fetchEditionBySlug(festival.id, editionSlug);
  if (!edition) return null;

  return {
    title: `${festival.name} - ${edition.name}`,
    description:
      edition.description ||
      festival.description ||
      "UpLine - Your Festival companion",
  };
}

async function resolveSetMeta(
  festivalSlug: string,
  editionSlug: string,
  setSlug: string,
): Promise<SocialMeta | null> {
  const festival = await fetchFestivalBySlug(festivalSlug);
  if (!festival) return null;

  const edition = await fetchEditionBySlug(festival.id, editionSlug);
  if (!edition) return null;

  const set = await fetchSetBySlug(edition.id, setSlug);
  if (!set) return null;

  return {
    title: `${set.name} - ${festival.name}`,
    description:
      set.description || `${set.name} at ${festival.name} ${edition.name}`,
  };
}

interface FestivalRecord {
  id: string;
  name: string;
  description: string | null;
}

interface EditionRecord {
  id: string;
  name: string;
  description: string | null;
}

interface SetRecord {
  name: string;
  description: string | null;
}

async function fetchFestivalBySlug(
  slug: string,
): Promise<FestivalRecord | null> {
  const rows = await supabaseSelect<FestivalRecord>("festivals", {
    select: "id,name,description",
    slug: `eq.${slug}`,
    archived: "eq.false",
  });
  return rows[0] ?? null;
}

async function fetchEditionBySlug(
  festivalId: string,
  slug: string,
): Promise<EditionRecord | null> {
  const rows = await supabaseSelect<EditionRecord>("festival_editions", {
    select: "id,name,description",
    festival_id: `eq.${festivalId}`,
    slug: `eq.${slug}`,
    archived: "eq.false",
  });
  return rows[0] ?? null;
}

async function fetchSetBySlug(
  editionId: string,
  slug: string,
): Promise<SetRecord | null> {
  const rows = await supabaseSelect<SetRecord>("sets", {
    select: "name,description",
    festival_edition_id: `eq.${editionId}`,
    slug: `eq.${slug}`,
    archived: "eq.false",
  });
  return rows[0] ?? null;
}

async function supabaseSelect<T>(
  table: string,
  params: Record<string, string>,
): Promise<T[]> {
  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const supabaseKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;
  if (!supabaseUrl || !supabaseKey) return [];

  const url = new URL(`${supabaseUrl}/rest/v1/${table}`);
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }

  const response = await fetch(url, {
    headers: {
      apikey: supabaseKey,
      authorization: `Bearer ${supabaseKey}`,
    },
  });
  if (!response.ok) return [];

  return response.json() as Promise<T[]>;
}

function applySocialMeta(html: string, meta: SocialMeta): string {
  const fullTitle = `${meta.title} - UpLine`;

  return html
    .replace(/<title>.*?<\/title>/, `<title>${escapeHtml(fullTitle)}</title>`)
    .replace(
      /<meta name="description" content=".*?"\s*\/>/,
      `<meta name="description" content="${escapeHtml(meta.description)}" />`,
    )
    .replace(
      /<meta property="og:title" content=".*?"\s*\/>/,
      `<meta property="og:title" content="${escapeHtml(fullTitle)}" />`,
    )
    .replace(
      /<meta\s+property="og:description"\s+content=".*?"\s*\/>/,
      `<meta property="og:description" content="${escapeHtml(meta.description)}" />`,
    );
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
