type Provider = "spotify" | "soundcloud";

export function validateProviderUrl(provider: Provider, url: string): boolean {
  if (!url || !url.trim()) {
    return false;
  }

  const trimmedUrl = url.trim();

  if (provider === "spotify") {
    try {
      const parsed = new URL(trimmedUrl);
      if (parsed.hostname !== "open.spotify.com") {
        return false;
      }
      return parsed.pathname.startsWith("/artist/");
    } catch {
      return false;
    }
  }

  if (provider === "soundcloud") {
    try {
      const parsed = new URL(trimmedUrl);
      if (!parsed.hostname.endsWith("soundcloud.com")) {
        return false;
      }
      return !parsed.pathname.endsWith("/");
    } catch {
      return false;
    }
  }

  return false;
}

export function extractProviderIdFromUrl(
  provider: Provider,
  url: string,
): string | null {
  if (!validateProviderUrl(provider, url)) {
    return null;
  }

  try {
    const parsed = new URL(url);

    if (provider === "spotify") {
      const match = parsed.pathname.match(/\/artist\/([a-zA-Z0-9]+)/);
      return match ? match[1] : null;
    }

    if (provider === "soundcloud") {
      return parsed.href;
    }

    return null;
  } catch {
    return null;
  }
}
