type Provider = "spotify" | "soundcloud";

function validateSpotifyUrl(trimmedUrl: string): boolean {
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

function validateSoundcloudUrl(trimmedUrl: string): boolean {
  try {
    const parsed = new URL(trimmedUrl);
    if (!parsed.hostname.endsWith("soundcloud.com")) {
      return false;
    }
    const path = parsed.pathname;
    if (path === "/" || path.endsWith("/")) {
      return false;
    }
    const pathSegments = path.split("/").filter(Boolean);
    return pathSegments.length === 1;
  } catch {
    return false;
  }
}

const providerUrlValidators: Record<Provider, (trimmedUrl: string) => boolean> =
  {
    spotify: validateSpotifyUrl,
    soundcloud: validateSoundcloudUrl,
  };

export function validateProviderUrl(provider: Provider, url: string): boolean {
  if (!url || !url.trim()) {
    return false;
  }

  return providerUrlValidators[provider](url.trim());
}
