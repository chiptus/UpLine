const DEFAULT_TITLE = "UpLine";
const TITLE_SEPARATOR = " - ";

interface PageMetaOptions {
  title?: string;
  prefix?: string;
  description?: string;
}

export function pageMeta({ title, prefix, description }: PageMetaOptions) {
  const fullTitle = buildTitle(title, prefix);

  const meta = [
    { title: fullTitle },
    { property: "og:title", content: fullTitle },
    { name: "twitter:title", content: fullTitle },
  ];

  if (description) {
    meta.push(
      { name: "description", content: description },
      { property: "og:description", content: description },
      { name: "twitter:description", content: description },
    );
  }

  return meta;
}

function getEnvironmentPrefix(): string | undefined {
  if (typeof window === "undefined") return undefined;

  const hostname = window.location.hostname;

  if (hostname === "localhost" || hostname === "127.0.0.1") {
    return "DEV";
  }

  if (!hostname.includes("getupline.com")) {
    return "STAG";
  }

  return undefined;
}

function buildTitle(title?: string, prefix?: string): string {
  const parts = [DEFAULT_TITLE];

  if (title) {
    parts.unshift(title);
  }

  if (prefix) {
    parts.unshift(prefix);
  }

  const envPrefix = getEnvironmentPrefix();
  if (envPrefix) {
    parts.unshift(envPrefix);
  }

  return parts.join(TITLE_SEPARATOR);
}
